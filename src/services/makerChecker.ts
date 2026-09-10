import { User, UserRole } from '../types';
import { db } from './db';

export type MakerCheckerOperationType =
  | 'BULK_DELETE_PRODUCTS'
  | 'DELETE_PRODUCT'
  | 'PRODUCT_PRICE_CHANGE'
  | 'SUPPLIER_MODIFICATION'
  | 'SUPPLIER_DELETION'
  | 'SYSTEM_CONFIG_UPDATE'
  | 'STOCK_VARIANCE_ADJUSTMENT'
  | 'VOID_OR_REFUND_SALE'
  | 'TILL_DEVICE_AUTHORIZATION';

export interface MakerCheckerRequest {
  id: string;
  operation: MakerCheckerOperationType;
  title: string;
  description: string;
  payload: any;
  makerStaffId: string;
  makerStaffName: string;
  makerRole: UserRole;
  makerTillId: string;
  checkerStaffId?: string;
  checkerStaffName?: string;
  checkerRole?: UserRole;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  resolvedAt?: string;
  rejectionReason?: string;
  requiredRole?: UserRole[];
}

const STORAGE_KEY_MAKER_CHECKER = 'bizora_maker_checker_queue';

class MakerCheckerService {
  private getQueue(): MakerCheckerRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_MAKER_CHECKER);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  private saveQueue(queue: MakerCheckerRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_MAKER_CHECKER, JSON.stringify(queue));
    } catch (e) {
      console.error('Failed to save Maker-Checker queue:', e);
    }
  }

  public getPendingRequests(): MakerCheckerRequest[] {
    return this.getQueue().filter((r) => r.status === 'pending');
  }

  public getAllRequests(): MakerCheckerRequest[] {
    return this.getQueue();
  }

  /**
   * Submit an operation into the Maker-Checker queue.
   */
  public submitRequest(params: {
    operation: MakerCheckerOperationType;
    title: string;
    description: string;
    payload: any;
    makerUser: User;
    makerTillId: string;
    requiredRole?: UserRole[];
  }): MakerCheckerRequest {
    const queue = this.getQueue();
    const newRequest: MakerCheckerRequest = {
      id: `MC-${Date.now().toString().slice(-6)}`,
      operation: params.operation,
      title: params.title,
      description: params.description,
      payload: params.payload,
      makerStaffId: params.makerUser.staffId,
      makerStaffName: `${params.makerUser.firstName} ${params.makerUser.lastName}`,
      makerRole: params.makerUser.role,
      makerTillId: params.makerTillId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      requiredRole: params.requiredRole || ['owner', 'superadmin', 'manager'],
    };

    queue.unshift(newRequest);
    this.saveQueue(queue);

    // Audit log
    db.addAuditLog({
      id: `AUD-MC-SUBMIT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'MAKER_CHECKER_SUBMITTED',
      module: 'SECURITY_RBAC',
      staffId: params.makerUser.staffId,
      staffName: `${params.makerUser.firstName} ${params.makerUser.lastName}`,
      tillId: params.makerTillId,
      details: `Submitted Maker-Checker request [${newRequest.id}] for '${params.title}'. Awaiting supervisor sign-off.`,
      severity: 'warning',
      ipOrDevice: params.makerTillId,
    });

    return newRequest;
  }

  /**
   * Verify if a supervisor PIN and user role qualifies for checker approval.
   */
  public verifySupervisorPin(pin: string, users: User[]): User | null {
    if (!pin || pin.length < 4) return null;
    const supervisor = users.find(
      (u) =>
        (u.role === 'owner' || u.role === 'superadmin' || u.role === 'manager') &&
        u.status === 'active' &&
        u.pin === pin
    );
    return supervisor || null;
  }

  /**
   * Approve a pending Maker-Checker request.
   */
  public approveRequest(
    requestId: string,
    checkerUser: User,
    checkerPin: string,
    allUsers: User[]
  ): { success: boolean; request?: MakerCheckerRequest; error?: string } {
    const supervisor = this.verifySupervisorPin(checkerPin, allUsers);
    if (!supervisor || supervisor.id !== checkerUser.id) {
      return { success: false, error: 'Invalid supervisor 6-digit PIN or insufficient privileges.' };
    }

    const queue = this.getQueue();
    const idx = queue.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      return { success: false, error: 'Request not found.' };
    }

    const req = queue[idx];
    if (req.status !== 'pending') {
      return { success: false, error: `Request already ${req.status}.` };
    }

    // Checker cannot be the exact maker for sensitive operations if multiple staff are available
    if (req.makerStaffId === supervisor.staffId && supervisor.role !== 'owner' && supervisor.role !== 'superadmin') {
      return { success: false, error: 'Dual-control violation: Maker cannot self-approve as checker.' };
    }

    req.status = 'approved';
    req.checkerStaffId = supervisor.staffId;
    req.checkerStaffName = `${supervisor.firstName} ${supervisor.lastName}`;
    req.checkerRole = supervisor.role;
    req.resolvedAt = new Date().toISOString();

    this.saveQueue(queue);

    // Write cryptographic audit log
    db.addAuditLog({
      id: `AUD-MC-APPROVE-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'MAKER_CHECKER_APPROVED',
      module: 'SECURITY_RBAC',
      staffId: supervisor.staffId,
      staffName: `${supervisor.firstName} ${supervisor.lastName}`,
      tillId: 'SUPERVISOR_CONSOLE',
      details: `Supervisor [${supervisor.firstName} (${supervisor.role})] approved Maker-Checker request [${req.id}] '${req.title}'.`,
      severity: 'critical',
      ipOrDevice: 'Console Authorization',
    });

    return { success: true, request: req };
  }

  /**
   * Reject a pending Maker-Checker request.
   */
  public rejectRequest(
    requestId: string,
    checkerUser: User,
    reason: string
  ): { success: boolean; error?: string } {
    const queue = this.getQueue();
    const idx = queue.findIndex((r) => r.id === requestId);
    if (idx === -1) {
      return { success: false, error: 'Request not found.' };
    }

    const req = queue[idx];
    req.status = 'rejected';
    req.checkerStaffId = checkerUser.staffId;
    req.checkerStaffName = `${checkerUser.firstName} ${checkerUser.lastName}`;
    req.checkerRole = checkerUser.role;
    req.rejectionReason = reason || 'Declined by supervisor';
    req.resolvedAt = new Date().toISOString();

    this.saveQueue(queue);

    db.addAuditLog({
      id: `AUD-MC-REJECT-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'MAKER_CHECKER_REJECTED',
      module: 'SECURITY_RBAC',
      staffId: checkerUser.staffId,
      staffName: `${checkerUser.firstName} ${checkerUser.lastName}`,
      tillId: 'SUPERVISOR_CONSOLE',
      details: `Supervisor [${checkerUser.firstName}] rejected Maker-Checker request [${req.id}]. Reason: ${req.rejectionReason}`,
      severity: 'warning',
      ipOrDevice: 'Console Authorization',
    });

    return { success: true };
  }

  /**
   * Direct instant Maker-Checker check:
   * Used for inline prompts (e.g., prompt for Supervisor PIN to delete immediately).
   */
  public directAuthorize(
    operation: MakerCheckerOperationType,
    title: string,
    supervisorPin: string,
    makerUser: User,
    allUsers: User[],
    details: string
  ): { authorized: boolean; supervisor?: User; error?: string } {
    const supervisor = this.verifySupervisorPin(supervisorPin, allUsers);
    if (!supervisor) {
      return { authorized: false, error: 'Invalid supervisor 6-digit PIN. Only Owner, SuperAdmin or Manager can authorize.' };
    }

    // Add immediate audit log
    db.addAuditLog({
      id: `AUD-DIRECT-AUTH-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'MAKER_CHECKER_DIRECT_AUTH',
      module: 'SECURITY_RBAC',
      staffId: supervisor.staffId,
      staffName: `${supervisor.firstName} ${supervisor.lastName}`,
      tillId: 'TILL-DIRECT',
      details: `Direct Maker-Checker sign-off by [${supervisor.firstName} (${supervisor.role})] for '${title}'. Executed by ${makerUser.firstName}. Details: ${details}`,
      severity: 'critical',
      ipOrDevice: 'Device Terminal',
    });

    return { authorized: true, supervisor };
  }
}

export const makerChecker = new MakerCheckerService();
