import React, { useState } from 'react';
import { Supplier, Organization, User } from '../types';
import { db } from '../services/db';
import {
  Building,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Edit2,
  Trash2,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { MakerCheckerModal } from '../components/MakerCheckerModal';

interface SuppliersScreenProps {
  suppliers: Supplier[];
  org: Organization;
  currentUser: User;
  users: User[];
  onReloadSuppliers: () => void;
}

export const SuppliersScreen: React.FC<SuppliersScreenProps> = ({
  suppliers,
  org,
  currentUser,
  users,
  onReloadSuppliers,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);

  // Maker-Checker state
  const [makerCheckerOpen, setMakerCheckerOpen] = useState(false);
  const [directOp, setDirectOp] = useState<{
    operation: any;
    title: string;
    description: string;
    details: string;
    onApproved: () => void;
  } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [kraPin, setKraPin] = useState('');
  const [address, setAddress] = useState('');
  const [paymentTerms, setPaymentTerms] = useState('Net 30');

  const filteredSuppliers = suppliers.filter((s) => {
    const term = searchTerm.toLowerCase();
    return (
      s.name.toLowerCase().includes(term) ||
      s.contactPerson.toLowerCase().includes(term) ||
      (s.kraPin && s.kraPin.toLowerCase().includes(term))
    );
  });

  const handleOpenAdd = () => {
    setEditingSupplier(null);
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setKraPin('');
    setAddress('');
    setPaymentTerms('Net 30');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setEditingSupplier(sup);
    setName(sup.name);
    setContactPerson(sup.contactPerson);
    setPhone(sup.phone);
    setEmail(sup.email);
    setKraPin(sup.kraPin || '');
    setAddress(sup.address);
    setPaymentTerms(sup.paymentTerms);
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = (sup: Supplier) => {
    setDirectOp({
      operation: 'SUPPLIER_DELETION',
      title: `Delete Supplier: ${sup.name}`,
      description: `Permanent deletion of supplier record and ledger binding.`,
      details: `KRA PIN: ${sup.kraPin || 'N/A'} | Balance Due: ${org.currency} ${sup.balanceDue.toLocaleString()}`,
      onApproved: () => {
        const list = db.getSuppliers().filter((s) => s.id !== sup.id);
        db.saveSuppliers(list);
        onReloadSuppliers();
      },
    });
    setMakerCheckerOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const commitSave = () => {
      const list = db.getSuppliers();
      if (editingSupplier) {
        const idx = list.findIndex((s) => s.id === editingSupplier.id);
        if (idx >= 0) {
          list[idx] = {
            ...editingSupplier,
            name: name.trim(),
            contactPerson: contactPerson.trim() || 'Accounts Rep',
            phone: phone.trim() || '+254 700 000 000',
            email: email.trim(),
            address: address.trim() || 'Industrial Area, Nairobi',
            kraPin: kraPin.trim().toUpperCase(),
            paymentTerms,
          };
          db.saveSuppliers(list);
        }
      } else {
        const newSupplier: Supplier = {
          id: `SUP-${Date.now().toString().slice(-4)}`,
          name: name.trim(),
          contactPerson: contactPerson.trim() || 'Accounts Rep',
          phone: phone.trim() || '+254 700 000 000',
          email: email.trim(),
          address: address.trim() || 'Industrial Area, Nairobi',
          kraPin: kraPin.trim().toUpperCase(),
          paymentTerms,
          balanceDue: 0,
          createdAt: new Date().toISOString(),
        };
        list.unshift(newSupplier);
        db.saveSuppliers(list);
      }
      setIsModalOpen(false);
      onReloadSuppliers();
    };

    // Sensitive Operation: Supplier Modification requires Maker-Checker Supervisor Sign-Off
    if (editingSupplier) {
      setDirectOp({
        operation: 'SUPPLIER_MODIFICATION',
        title: `Authorize Supplier Modification: ${editingSupplier.name}`,
        description: `Updating verified supplier details and procurement terms for "${name}".`,
        details: `Payment Terms: ${paymentTerms} | KRA PIN: ${kraPin.toUpperCase()}`,
        onApproved: commitSave,
      });
      setMakerCheckerOpen(true);
    } else {
      commitSave();
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Suppliers & Procurement Accounts
          </h2>
          <p className="text-xs text-slate-500">
            Hardware manufacturers, distributors, KRA PIN compliance, and procurement terms.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by supplier name, contact person, or KRA PIN..."
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#101f42]"
        />
      </div>

      {/* Suppliers Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 text-slate-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Supplier & KRA PIN</th>
                <th className="py-3 px-4">Contact Person</th>
                <th className="py-3 px-4">Phone & Email</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Payment Terms</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400">
                    No suppliers match your search.
                  </td>
                </tr>
              ) : (
                filteredSuppliers.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{sup.name}</div>
                      <div className="text-[10px] text-blue-700 font-mono font-bold">
                        PIN: {sup.kraPin || 'EXEMPT'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {sup.contactPerson}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono text-[11px]">
                      <div>{sup.phone}</div>
                      <div className="text-slate-400 text-[10px]">{sup.email || '—'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 text-[11px] max-w-xs truncate">
                      {sup.address}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-800">
                        {sup.paymentTerms}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-slate-900 text-right">
                      {org.currency} {sup.balanceDue.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(sup)}
                          title="Edit Supplier (Maker-Checker Sign-off)"
                          className="p-1 text-slate-400 hover:text-blue-600 rounded hover:bg-slate-100 transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(sup)}
                          title="Delete Supplier (Maker-Checker Dual Control)"
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Supplier Edit / Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#101f42] text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-extrabold text-sm tracking-wide text-white">
                {editingSupplier ? 'Modify Supplier Record' : 'Register New Supplier'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white/10 p-1 rounded"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-6 space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Supplier Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-[#101f42]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">KRA PIN</label>
                  <input
                    type="text"
                    value={kraPin}
                    onChange={(e) => setKraPin(e.target.value)}
                    placeholder="P051..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono uppercase outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Physical Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Payment Terms</label>
                <select
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none"
                >
                  <option value="Cash on Delivery">Cash on Delivery (COD)</option>
                  <option value="Net 7">Net 7 Days</option>
                  <option value="Net 14">Net 14 Days</option>
                  <option value="Net 30">Net 30 Days</option>
                  <option value="Net 60">Net 60 Days</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#101f42] hover:bg-[#1a2b6b] text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  {editingSupplier ? 'Authorize Modification' : 'Save Supplier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Maker-Checker Direct Authorization Modal */}
      {makerCheckerOpen && directOp && (
        <MakerCheckerModal
          isOpen={makerCheckerOpen}
          onClose={() => setMakerCheckerOpen(false)}
          currentUser={currentUser}
          users={users}
          directOperation={directOp}
        />
      )}
    </div>
  );
};
