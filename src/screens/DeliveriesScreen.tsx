import React, { useState } from 'react';
import { Delivery, Organization, Sale, MerchantSale } from '../types';
import { db } from '../services/db';
import {
  Truck,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  MapPin,
  Phone,
  Printer,
  Eye,
  FileSpreadsheet,
  PackageCheck,
} from 'lucide-react';

interface DeliveriesScreenProps {
  org: Organization;
}

export const DeliveriesScreen: React.FC<DeliveriesScreenProps> = ({ org }) => {
  const [deliveries, setDeliveries] = useState<Delivery[]>(() => db.getDeliveries());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [driverName, setDriverName] = useState('Joseph K.');
  const [vehicleReg, setVehicleReg] = useState('KDA 492L (Canter 3T)');
  const [itemsText, setItemsText] = useState('East African Cables 2.5mm (5 Rolls)\nBamburi Tembo Cement (40 Bags)');
  const [linkedRef, setLinkedRef] = useState('ORD-REF-001');

  const reloadData = () => {
    setDeliveries(db.getDeliveries());
  };

  const filteredDeliveries = deliveries.filter((d) => {
    const s = searchTerm.toLowerCase();
    return (
      d.deliveryNumber.toLowerCase().includes(s) ||
      d.customerName.toLowerCase().includes(s) ||
      d.vehicleReg.toLowerCase().includes(s) ||
      d.driverName.toLowerCase().includes(s)
    );
  });

  const handleCreateDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const items = itemsText
      .split('\n')
      .filter((l) => l.trim())
      .map((line) => ({
        productName: line.trim(),
        quantity: 1,
        unit: 'Pcs',
      }));

    const newDelivery: Delivery = {
      id: `DEL-${Date.now()}`,
      deliveryNumber: `DN-${Date.now().toString().slice(-6)}`,
      linkedSaleId: linkedRef,
      customerName: custName.trim(),
      customerPhone: custPhone.trim(),
      deliveryAddress: deliveryAddress.trim() || 'Site Address',
      items,
      driverName: driverName.trim(),
      vehicleReg: vehicleReg.trim(),
      status: 'dispatched',
      dispatchedAt: new Date().toISOString(),
      notes: 'Hardware site dispatch with delivery note slip.',
    };

    db.addDelivery(newDelivery);
    reloadData();
    setIsCreateOpen(false);
    setCustName('');
    setCustPhone('');
  };

  const handleUpdateStatus = (delId: string, status: Delivery['status']) => {
    const list = db.getDeliveries();
    const idx = list.findIndex((d) => d.id === delId);
    if (idx >= 0) {
      list[idx].status = status;
      if (status === 'delivered') {
        list[idx].deliveredAt = new Date().toISOString();
      }
      db.saveDeliveries(list);
      reloadData();
      if (selectedDelivery && selectedDelivery.id === delId) {
        setSelectedDelivery(list[idx]);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Deliveries & Dispatch Management</h2>
            <p className="text-xs text-slate-500">
              Site logistics, delivery notes linked to Merchant Sales & ETR invoices, vehicle tracking.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search delivery notes, driver, vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Generate Delivery Note</span>
          </button>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 z-10">
              <tr>
                <th className="p-3.5 font-bold">Delivery Note #</th>
                <th className="p-3.5 font-bold">Customer & Phone</th>
                <th className="p-3.5 font-bold">Destination Address</th>
                <th className="p-3.5 font-bold">Driver & Vehicle</th>
                <th className="p-3.5 font-bold">Linked Order</th>
                <th className="p-3.5 font-bold">Status</th>
                <th className="p-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDeliveries.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    No active deliveries. Click "Generate Delivery Note" to create one.
                  </td>
                </tr>
              ) : (
                filteredDeliveries.map((del) => (
                  <tr key={del.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3.5 font-mono font-bold text-emerald-800">
                      {del.deliveryNumber}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900">
                      <div>{del.customerName}</div>
                      <div className="text-[10px] text-slate-400">{del.customerPhone}</div>
                    </td>
                    <td className="p-3.5 text-slate-600 max-w-xs truncate">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate">{del.deliveryAddress}</span>
                      </div>
                    </td>
                    <td className="p-3.5 text-slate-700">
                      <div>{del.driverName}</div>
                      <div className="text-[10px] text-slate-500 font-mono font-bold">
                        {del.vehicleReg}
                      </div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {del.linkedSaleId || del.linkedMerchantSaleId || 'Retail Order'}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          del.status === 'delivered'
                            ? 'bg-emerald-100 text-emerald-800'
                            : del.status === 'in_transit'
                            ? 'bg-blue-100 text-blue-800'
                            : del.status === 'dispatched'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        <span className="uppercase">{del.status.replace('_', ' ')}</span>
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedDelivery(del)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View Slip</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Delivery Note Slip Modal */}
      {selectedDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Delivery Note #{selectedDelivery.deliveryNumber}
                </h3>
                <p className="text-[11px] text-slate-500">Bizora Dispatch & Logistics Slip</p>
              </div>
              <button
                onClick={() => setSelectedDelivery(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">CUSTOMER:</span>
                <span className="font-bold text-slate-800">{selectedDelivery.customerName}</span>
                <span className="text-[10px] text-slate-500 block">{selectedDelivery.customerPhone}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold block">VEHICLE & DRIVER:</span>
                <span className="font-bold text-slate-800">{selectedDelivery.driverName}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{selectedDelivery.vehicleReg}</span>
              </div>
              <div className="col-span-2">
                <span className="text-[10px] text-slate-400 font-bold block">DELIVERY ADDRESS:</span>
                <span className="font-medium text-slate-800">{selectedDelivery.deliveryAddress}</span>
              </div>
            </div>

            {/* Items */}
            <div>
              <div className="font-bold text-slate-700 uppercase mb-1">Delivered Hardware Products:</div>
              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-40 overflow-y-auto">
                {selectedDelivery.items.map((it, idx) => (
                  <div key={idx} className="p-2 flex justify-between">
                    <span className="font-medium text-slate-800">{it.productName}</span>
                    <span className="font-mono text-slate-600">
                      {it.quantity} {it.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Status transitions */}
            <div className="flex items-center justify-between border-t pt-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Update Status:</span>
                <select
                  value={selectedDelivery.status}
                  onChange={(e) => handleUpdateStatus(selectedDelivery.id, e.target.value as any)}
                  className="px-2.5 py-1 border border-slate-300 rounded-lg bg-white font-semibold"
                >
                  <option value="pending">Pending</option>
                  <option value="dispatched">Dispatched</option>
                  <option value="in_transit">In Transit</option>
                  <option value="delivered">Delivered (Completed)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={() => window.print()}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Delivery Note Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-4 overflow-y-auto">
          <form
            onSubmit={handleCreateDelivery}
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-slate-900">Issue New Delivery Note</h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Customer / Site Name *</label>
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  placeholder="e.g. Apex Builders Site"
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={custPhone}
                  onChange={(e) => setCustPhone(e.target.value)}
                  placeholder="e.g. 0712345678"
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">Delivery Destination</label>
              <input
                type="text"
                required
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. Kilimani Road Site 4B, Nairobi"
                className="w-full px-3 py-2 border rounded-lg bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Assigned Driver</label>
                <input
                  type="text"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-700 block mb-1">Vehicle Registration</label>
                <input
                  type="text"
                  value={vehicleReg}
                  onChange={(e) => setVehicleReg(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white font-mono"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                Products to Dispatch (One per line):
              </label>
              <textarea
                rows={3}
                value={itemsText}
                onChange={(e) => setItemsText(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg bg-white font-mono text-xs"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t">
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
              >
                Issue Delivery Note
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
