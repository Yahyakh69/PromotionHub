import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { authService } from '../../services/authService';
import { Partner, Promotion, SKU, SalesReport, PartnerType, RebateCalculation } from '../../types';
import { DollarSign, TrendingUp, Package, Calendar, Download, Printer, AlertCircle } from 'lucide-react';

export const PartnerDashboard: React.FC = () => {
  const user = authService.getCurrentUser();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [myReports, setMyReports] = useState<SalesReport[]>([]);

  // Submission State
  const [selectedPromoId, setSelectedPromoId] = useState('');
  const [salesInput, setSalesInput] = useState<{[skuId: string]: number}>({});

  useEffect(() => {
    if (user?.partnerId) {
      const allPartners = storageService.getPartners();
      const currentPartner = allPartners.find(p => p._id === user.partnerId);
      setPartner(currentPartner || null);

      setPromotions(storageService.getPromotions());
      setSkus(storageService.getSKUs());
      
      const allReports = storageService.getSalesReports();
      setMyReports(allReports.filter(r => r.partnerId === user.partnerId));
    }
  }, [user]);

  // Calculations
  const activePromotions = promotions.filter(p => p.status === 'ACTIVE');
  
  let totalClaimed = 0;
  let totalPaid = 0;
  
  const claimHistory: RebateCalculation[] = [];

  myReports.forEach(report => {
    const promo = promotions.find(p => p._id === report.promotionId);
    const sku = skus.find(s => s._id === report.skuId);
    
    if (promo && sku) {
      const item = promo.items.find(i => i.skuId === sku._id);
      if (item) {
        // Updated Formula for Portal
        const claimMarginRate = report.claimPercentage ?? 0;
        const priceDrop = sku.originalPrice - item.promoPrice;
        const partnerShare = priceDrop * (claimMarginRate / 100);
        const effectiveRebatePerUnit = Math.max(0, priceDrop - partnerShare);
        
        const totalVal = effectiveRebatePerUnit * report.quantitySold;
        
        totalClaimed += totalVal;
        if (report.paymentStatus === 'PAID') {
          totalPaid += totalVal;
        }

        claimHistory.push({
            reportId: report._id,
            partnerName: partner?.name || '',
            partnerType: partner?.type || PartnerType.DEALER,
            skuCode: sku.code,
            skuName: sku.name,
            originalPrice: sku.originalPrice,
            promoPrice: item.promoPrice,
            quantitySold: report.quantitySold,
            rebatePerUnit: effectiveRebatePerUnit,
            claimPercentage: claimMarginRate,
            effectiveRebate: effectiveRebatePerUnit,
            totalRebate: totalVal,
            paymentStatus: report.paymentStatus,
            paymentReference: report.paymentReference,
            paymentDate: report.paymentDate
        });
      }
    }
  });

  const pendingAmount = totalClaimed - totalPaid;

  const handleSubmitSales = () => {
    if (!selectedPromoId || !partner) return;

    let submissionCount = 0;
    Object.entries(salesInput).forEach(([skuId, qty]) => {
      const quantity = qty as number;
      if (quantity > 0) {
        storageService.addSale({
          promotionId: selectedPromoId,
          partnerId: partner._id,
          skuId,
          quantitySold: quantity,
          // Snapshot the current margin/discount rate
          claimPercentage: partner.discountRate || 0, 
          submittedAt: new Date().toISOString()
        });
        submissionCount++;
      }
    });

    if (submissionCount > 0) {
      alert("Sales submitted successfully! Claims are now pending review.");
      setSalesInput({});
      // Refresh local data
      const allReports = storageService.getSalesReports();
      setMyReports(allReports.filter(r => r.partnerId === user?.partnerId));
    }
  };

  const handleExportCSV = () => {
    if (claimHistory.length === 0) {
      alert("No data to export.");
      return;
    }
    const headers = ['Campaign', 'SKU', 'Product', 'Sold Qty', 'Rebate/Unit', 'Total Claim', 'Status', 'Paid Date', 'Ref'];
    const rows = claimHistory.map(d => {
        const promoName = promotions.find(p => p.items.some(i => i.skuId === skus.find(s => s.name === d.skuName)?._id))?.name || 'Campaign';
        return [
            promoName, d.skuCode, d.skuName, d.quantitySold, d.effectiveRebate.toFixed(2), d.totalRebate.toFixed(2),
            d.paymentStatus, d.paymentDate || '', d.paymentReference || ''
        ].join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + headers.join(',') + "\n" + rows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `my_claims_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const selectedPromo = promotions.find(p => p._id === selectedPromoId);

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Welcome back, {partner?.name}</h1>
        <p className="text-gray-500">Track your active promotions and compensation status.</p>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
           <div className="p-3 bg-blue-100 text-blue-600 rounded-full"><DollarSign size={24} /></div>
           <div>
             <p className="text-sm text-gray-500 font-medium">Total Earnings</p>
             <h3 className="text-2xl font-bold text-gray-900">${totalClaimed.toFixed(2)}</h3>
           </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
           <div className="p-3 bg-green-100 text-green-600 rounded-full"><TrendingUp size={24} /></div>
           <div>
             <p className="text-sm text-gray-500 font-medium">Total Paid</p>
             <h3 className="text-2xl font-bold text-green-600">${totalPaid.toFixed(2)}</h3>
           </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center gap-4">
           <div className="p-3 bg-orange-100 text-orange-600 rounded-full"><AlertCircle size={24} /></div>
           <div>
             <p className="text-sm text-gray-500 font-medium">Pending Payout</p>
             <h3 className="text-2xl font-bold text-orange-600">${pendingAmount.toFixed(2)}</h3>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Column: Active Promos & Submission */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
             <div className="p-6 border-b border-gray-200 bg-gray-50">
               <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                 <Package size={20} className="text-blue-600"/> Submit Sales Report
               </h2>
               <p className="text-sm text-gray-500 mt-1">Select an active campaign and enter quantity sold to claim rebates.</p>
             </div>
             
             <div className="p-6 space-y-6">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">Select Active Campaign</label>
                   <select 
                     className="w-full border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                     value={selectedPromoId}
                     onChange={(e) => setSelectedPromoId(e.target.value)}
                   >
                     <option value="">-- Choose Campaign --</option>
                     {activePromotions.map(p => (
                       <option key={p._id} value={p._id}>{p.name} (Valid until {p.endDate})</option>
                     ))}
                   </select>
                </div>

                {selectedPromo && partner && (
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex justify-between items-center mb-4">
                       <h3 className="font-semibold text-gray-800">Enter Quantities</h3>
                       <div className="text-xs text-right">
                         <span className="block font-bold text-gray-700">Margin: {partner.discountRate || 0}%</span>
                         <span className="text-gray-500">Your coverage of price drop</span>
                       </div>
                    </div>
                    
                    <div className="space-y-3">
                      {selectedPromo.items.map(item => {
                        const sku = skus.find(s => s._id === item.skuId);
                        if (!sku) return null;
                        
                        const drop = sku.originalPrice - item.promoPrice;
                        const myShare = drop * ((partner.discountRate || 0)/100);
                        const rebate = Math.max(0, drop - myShare);

                        return (
                          <div key={item.skuId} className="flex justify-between items-center bg-white p-3 rounded border border-gray-200">
                            <div>
                              <p className="font-medium text-sm text-gray-900">{sku.name}</p>
                              <div className="text-xs text-gray-500 flex gap-2">
                                <span>Org: ${sku.originalPrice}</span>
                                <span>Promo: ${item.promoPrice}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded">
                                 Claim: ${rebate.toFixed(2)}
                              </span>
                              <input 
                                type="number" 
                                min="0"
                                className="w-20 border border-gray-300 rounded p-1.5 text-center text-sm font-bold focus:ring-blue-500 focus:border-blue-500"
                                value={salesInput[item.skuId] || ''}
                                onChange={(e) => setSalesInput({...salesInput, [item.skuId]: Number(e.target.value)})}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      onClick={handleSubmitSales}
                      className="mt-6 w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm"
                    >
                      Submit Sales Report
                    </button>
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Sidebar Column: Active Campaigns List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-green-600" /> Active Promotions
            </h3>
            <div className="space-y-4">
              {activePromotions.length > 0 ? activePromotions.map(p => (
                <div key={p._id} className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded-r-lg">
                   <h4 className="font-bold text-sm text-gray-900">{p.name}</h4>
                   <p className="text-xs text-gray-600 mt-1">Ends: {p.endDate}</p>
                   <p className="text-xs text-blue-600 mt-1 font-medium">{p.items.length} SKUs eligible</p>
                </div>
              )) : (
                <p className="text-gray-500 text-sm italic">No active promotions at the moment.</p>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Claim History Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h2 className="text-lg font-bold text-gray-900">Claim History & Status</h2>
          <div className="flex gap-2">
            <button onClick={handleExportCSV} className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Download size={16} /> CSV
            </button>
            <button onClick={handlePrint} className="flex items-center gap-2 px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50">
              <Printer size={16} /> Print Report
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-3">Product</th>
                <th className="px-6 py-3 text-right">Sold Qty</th>
                <th className="px-6 py-3 text-right">Rebate/Unit</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Reference</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {claimHistory.length > 0 ? claimHistory.map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{row.skuName}</td>
                  <td className="px-6 py-3 text-right">{row.quantitySold}</td>
                  <td className="px-6 py-3 text-right">${row.effectiveRebate.toFixed(2)}</td>
                  <td className="px-6 py-3 text-right font-bold text-blue-600">${row.totalRebate.toFixed(2)}</td>
                  <td className="px-6 py-3 text-center">
                    {row.paymentStatus === 'PAID' ? (
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-800">
                         PAID
                       </span>
                    ) : (
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                         PENDING
                       </span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right text-xs text-gray-500">
                    {row.paymentReference ? (
                      <div>
                        <div>{row.paymentReference}</div>
                        <div>{row.paymentDate}</div>
                      </div>
                    ) : '-'}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-400">No claims submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Print Styles */}
      <style>{`
        @media print {
          nav, button { display: none !important; }
          body { background: white; }
          .shadow-sm { box-shadow: none !important; border: 1px solid #ddd !important; }
        }
      `}</style>
    </div>
  );
};