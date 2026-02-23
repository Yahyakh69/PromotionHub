import React, { useState } from 'react';
import { RebateCalculation, PartnerType } from '../types';
import { Calculator, Download, Plus, CheckCircle, Circle, X } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convexApi';

export const Rebates: React.FC = () => {
  const promotions = useQuery(api.promotions.get) || [];
  const partners = useQuery(api.partners.get) || [];
  const skus = useQuery(api.skus.get) || [];
  const reports = useQuery(api.sales.get) || [];
  
  const submitSale = useMutation(api.sales.submit);
  const updateSale = useMutation(api.sales.update);

  // Selection State
  const [selectedPromoId, setSelectedPromoId] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [salesInput, setSalesInput] = useState<{[skuId: string]: number}>({});
  
  // Filter for Rebate View
  const [filterPromoId, setFilterPromoId] = useState('');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ reportId: '', ttReference: '', paymentDate: '' });

  const selectedPartner = partners.find((p: any) => p._id === selectedPartnerId);

  const handleSalesSubmit = async () => {
    if (!selectedPromoId || !selectedPartnerId || !selectedPartner) return;

    try {
      // Use the partner's stored discount rate (margin)
      const activeDiscountRate = selectedPartner.discountRate || 0;

      for (const [skuId, qty] of Object.entries(salesInput)) {
        const quantity = qty as number;
        if (quantity > 0) {
          await submitSale({
            promotionId: selectedPromoId,
            partnerId: selectedPartnerId,
            skuId,
            quantitySold: quantity,
            claimPercentage: activeDiscountRate,
            submittedAt: new Date().toISOString()
          });
        }
      }

      setSalesInput({});
      alert("Sales/Claim report submitted successfully!");
    } catch (e) {
      console.error(e);
      alert("Error submitting sales.");
    }
  };

  const openPaymentModal = (reportId: string) => {
    setPaymentForm({
      reportId,
      ttReference: '',
      paymentDate: new Date().toISOString().split('T')[0]
    });
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSubmit = async () => {
    if (!paymentForm.ttReference || !paymentForm.paymentDate) {
      alert("Please enter TT Reference and Date");
      return;
    }
    
    await updateSale({
      id: paymentForm.reportId,
      paymentStatus: 'PAID',
      paymentReference: paymentForm.ttReference,
      paymentDate: paymentForm.paymentDate
    });

    setIsPaymentModalOpen(false);
  };

  const calculateRebates = (promoIdFilter?: string): RebateCalculation[] => {
    const calculations: RebateCalculation[] = [];
    
    const filteredReports = promoIdFilter 
      ? reports.filter((r: any) => r.promotionId === promoIdFilter) 
      : reports;

    filteredReports.forEach((report: any) => {
      const promo = promotions.find((p: any) => p._id === report.promotionId);
      const partner = partners.find((p: any) => p._id === report.partnerId);
      const sku = skus.find((s: any) => s._id === report.skuId);
      
      if (!promo || !partner || !sku) return;
      
      const promoItem = promo.items.find((i: any) => i.skuId === sku._id);
      if (!promoItem) return;

      let effectiveRebatePerUnit = 0;
      const snapshotRate = report.claimPercentage ?? 0;

      // UNIFIED FORMULA
      // Price Drop = Original - Promo
      // Partner Share = Price Drop * (Margin%)
      // Rebate = Price Drop - Partner Share
      const priceDrop = sku.originalPrice - promoItem.promoPrice;
      const partnerShare = priceDrop * (snapshotRate / 100);
      effectiveRebatePerUnit = priceDrop - partnerShare;
      effectiveRebatePerUnit = Math.max(0, effectiveRebatePerUnit);

      calculations.push({
        reportId: report._id,
        partnerName: partner.name,
        partnerType: partner.type,
        skuCode: sku.code,
        skuName: sku.name,
        originalPrice: sku.originalPrice,
        promoPrice: promoItem.promoPrice,
        quantitySold: report.quantitySold,
        rebatePerUnit: effectiveRebatePerUnit,
        claimPercentage: snapshotRate,
        effectiveRebate: effectiveRebatePerUnit,
        totalRebate: effectiveRebatePerUnit * report.quantitySold,
        paymentStatus: report.paymentStatus || 'UNPAID',
        paymentReference: report.paymentReference,
        paymentDate: report.paymentDate
      });
    });

    return calculations;
  };

  const exportToCSV = () => {
    if (!filterPromoId) {
      alert("Please select a campaign to export.");
      return;
    }

    const data = calculateRebates(filterPromoId);
    if (data.length === 0) {
      alert("No data to export for this campaign.");
      return;
    }

    const escapeCsv = (field: any) => {
      if (field === null || field === undefined) return '';
      const stringField = String(field);
      if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
      }
      return stringField;
    };

    const headers = ['Partner', 'Type', 'SKU', 'Product', 'Claim Qty', 'Org Price', 'Promo Price', 'Margin Used', 'Eff. Comp/Unit', 'Total Value', 'Status'];
    
    const csvRows = [
      headers.map(escapeCsv).join(','),
      ...data.map(d => [
        d.partnerName,
        d.partnerType,
        d.skuCode,
        d.skuName,
        d.quantitySold,
        d.originalPrice,
        d.promoPrice,
        `${d.claimPercentage}%`,
        d.effectiveRebate.toFixed(2),
        d.totalRebate.toFixed(2),
        d.paymentStatus
      ].map(escapeCsv).join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const promoName = promotions.find((p: any) => p._id === filterPromoId)?.name || 'report';
    link.setAttribute("download", `rebate_report_${promoName.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const rebateData = calculateRebates(filterPromoId || undefined);
  const selectedPromo = promotions.find((p: any) => p._id === selectedPromoId);

  return (
    <div className="space-y-6">
       <h2 className="text-2xl font-bold text-gray-900">Claims & Compensation Tracking</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Sales Entry Form */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-blue-600" /> Submit Claim / Sales
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Campaign</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white" 
                   value={selectedPromoId} onChange={(e) => setSelectedPromoId(e.target.value)}>
                   <option value="">-- Select --</option>
                   {promotions.filter((p: any) => p.status === 'ACTIVE').map((p: any) => (
                     <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                   ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Partner Profile</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white" 
                   value={selectedPartnerId} onChange={(e) => setSelectedPartnerId(e.target.value)}>
                   <option value="">-- Select --</option>
                   {partners.map((p: any) => (
                     <option key={p._id} value={p._id}>{p.name} ({p.type})</option>
                   ))}
                </select>
              </div>

              {selectedPartner && (
                <div className={`p-3 rounded-md border ${selectedPartner.type === PartnerType.DEALER ? 'bg-indigo-50 border-indigo-100' : 'bg-green-50 border-green-100'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <label className="block text-xs font-semibold uppercase tracking-wide opacity-80">
                         {selectedPartner.type} Policy
                      </label>
                      <p className="text-sm font-bold mt-1">
                        Margin Rate: {selectedPartner.discountRate || 0}%
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 text-right max-w-[150px]">
                         Formula:<br/> (Price Drop) * (1 - {selectedPartner.discountRate || 0}%)
                    </div>
                  </div>
                </div>
              )}

              {selectedPromo && selectedPartner && (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 mt-4">
                  <h4 className="text-sm font-semibold text-gray-800 mb-2">Enter Claim Qty (Sales):</h4>
                  <div className="space-y-2">
                    {selectedPromo.items.map((item: any) => {
                      const sku = skus.find((s: any) => s._id === item.skuId);
                      if (!sku) return null;
                      
                      const diff = sku.originalPrice - item.promoPrice;
                      const rate = selectedPartner.discountRate || 0;
                      const estimatedRebate = Math.max(0, diff * (1 - rate/100));

                      return (
                        <div key={item.skuId} className="flex justify-between items-center py-2 border-b border-dashed border-gray-200 last:border-0">
                          <div>
                             <span className="text-sm font-medium text-gray-700 block">{sku.name}</span>
                             <div className="text-[10px] text-gray-500 flex gap-2">
                               <span>Org: ${sku.originalPrice}</span>
                               <span>Promo: ${item.promoPrice}</span>
                             </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
                                Claim: ${estimatedRebate.toFixed(2)}
                            </span>
                            <input 
                              type="number" 
                              className="w-20 text-sm border-gray-300 rounded p-1.5 outline-none focus:ring-1 focus:ring-blue-500 text-center" 
                              placeholder="Qty"
                              value={salesInput[item.skuId] || ''}
                              onChange={(e) => setSalesInput({...salesInput, [item.skuId]: Number(e.target.value)})}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <button 
                onClick={handleSalesSubmit}
                disabled={!selectedPromoId || !selectedPartnerId}
                className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 transition-colors"
              >
                Submit Claim
              </button>
            </div>
         </div>

         {/* Rebate Calculation Overview */}
         <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Calculator size={20} className="text-green-600" /> Compensation View
              </h3>
              <div className="flex gap-2 w-full sm:w-auto">
                 <select 
                    className="text-sm border-gray-300 rounded-md p-1.5 bg-white border outline-none focus:ring-1 focus:ring-blue-500 flex-1"
                    value={filterPromoId}
                    onChange={(e) => setFilterPromoId(e.target.value)}
                 >
                    <option value="">All Campaigns</option>
                    {promotions.map((p: any) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                 </select>
                 <button onClick={exportToCSV} className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-md flex items-center gap-1 font-medium transition-colors">
                    <Download size={16} /> Export
                 </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 sticky top-0 shadow-sm">
                  <tr>
                    <th className="px-3 py-2 text-gray-600">Partner</th>
                    <th className="px-3 py-2 text-gray-600">Details</th>
                    <th className="px-3 py-2 text-right text-gray-600">Total</th>
                    <th className="px-3 py-2 text-center text-gray-600">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rebateData.map((d, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-3 py-2 align-top">
                        <div className="font-medium text-gray-900">{d.partnerName}</div>
                        <div className="text-[10px] text-gray-500">{d.partnerType}</div>
                      </td>
                      <td className="px-3 py-2 align-top text-gray-600">
                        <div className="font-medium">{d.skuName}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5 grid grid-cols-2 gap-x-2">
                           <span>Qty: {d.quantitySold}</span>
                           <span>Org: ${d.originalPrice}</span>
                           <span>Promo: ${d.promoPrice}</span>
                           <span title="Effective Payback" className="font-semibold text-gray-600">Unit Pay: ${d.effectiveRebate.toFixed(2)}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right align-top font-bold text-green-600">${d.totalRebate.toFixed(2)}</td>
                      <td className="px-3 py-2 align-top text-center">
                        {d.paymentStatus === 'PAID' ? (
                          <div className="flex flex-col items-center">
                            <span className="flex items-center gap-1 text-green-700 font-bold bg-green-100 px-2 py-0.5 rounded-full text-[10px]">
                               <CheckCircle size={10} /> PAID
                            </span>
                            <div className="text-[9px] text-gray-400 mt-0.5">Ref: {d.paymentReference}</div>
                            <div className="text-[9px] text-gray-400">{d.paymentDate}</div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => openPaymentModal(d.reportId)}
                            className="flex items-center gap-1 text-gray-500 hover:text-blue-600 border border-gray-300 hover:border-blue-400 px-2 py-1 rounded-md text-[10px] mx-auto transition-colors"
                          >
                            <Circle size={10} /> Mark Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {rebateData.length === 0 && (
                     <tr>
                       <td colSpan={4} className="text-center py-8 text-gray-400">
                         {filterPromoId ? 'No claims for selected campaign.' : 'No data available.'}
                       </td>
                     </tr>
                  )}
                </tbody>
              </table>
            </div>
         </div>
       </div>

       {/* Payment Modal */}
       {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Mark Claim as Paid</h3>
              <button onClick={() => setIsPaymentModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">TT / Payment Reference</label>
                <input 
                   type="text" 
                   className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                   placeholder="e.g. TRF-12345678"
                   value={paymentForm.ttReference} 
                   onChange={e => setPaymentForm({...paymentForm, ttReference: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Payment Date</label>
                <input 
                   type="date" 
                   className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                   value={paymentForm.paymentDate} 
                   onChange={e => setPaymentForm({...paymentForm, paymentDate: e.target.value})} 
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handlePaymentSubmit} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};