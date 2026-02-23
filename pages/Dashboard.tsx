import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Tag, Package, TrendingUp, BarChart3, PieChart, DollarSign } from 'lucide-react';
import { Partner, Promotion, SKU, SalesReport } from '../types';
import { storageService } from '../services/storageService';

const StatCard = ({ title, value, icon: Icon, color, onClick }: any) => (
  <div 
    onClick={onClick}
    className={`bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center space-x-4 cursor-pointer transition-transform hover:scale-105 hover:shadow-md`}
  >
    <div className={`p-3 rounded-full ${color} bg-opacity-10`}>
      <Icon size={24} className={`${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-sm text-gray-500 font-medium">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900">{value}</h3>
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [skus, setSkus] = useState<SKU[]>([]);
  const [reports, setReports] = useState<SalesReport[]>([]);

  useEffect(() => {
    setPartners(storageService.getPartners());
    setPromotions(storageService.getPromotions());
    setSkus(storageService.getSKUs());
    setReports(storageService.getSalesReports());
  }, []);

  const activePromos = promotions.filter(p => p.status === 'ACTIVE').length;
  
  // Calculate total units sold
  const totalUnitsSold = reports.reduce((acc, curr) => acc + curr.quantitySold, 0);

  // Derive simple analytics
  const salesByPartner = partners.map(partner => {
    const total = reports
      .filter(r => r.partnerId === partner._id)
      .reduce((acc, r) => acc + r.quantitySold, 0);
    return { name: partner.name, total };
  }).sort((a, b) => b.total - a.total).slice(0, 5); // Top 5

  const salesBySKU = skus.map(sku => {
    const total = reports
      .filter(r => r.skuId === sku._id)
      .reduce((acc, r) => acc + r.quantitySold, 0);
    return { name: sku.name, code: sku.code, total };
  }).sort((a, b) => b.total - a.total).slice(0, 5); // Top 5

  const maxPartnerSales = Math.max(...salesByPartner.map(s => s.total), 1);
  const maxSkuSales = Math.max(...salesBySKU.map(s => s.total), 1);

  // --- Payment / Outstanding Balance Calculation ---
  const partnerBalances = partners.map(partner => {
     let totalClaimValue = 0;
     let totalPaid = 0;

     const partnerReports = reports.filter(r => r.partnerId === partner._id);
     
     partnerReports.forEach(report => {
        const promo = promotions.find(p => p._id === report.promotionId);
        const sku = skus.find(s => s._id === report.skuId);
        if(promo && sku) {
           const item = promo.items.find(i => i.skuId === sku._id);
           if(item) {
             const claimPercent = report.claimPercentage ?? 100;
             const value = (item.rebateAmount * (claimPercent / 100)) * report.quantitySold;
             totalClaimValue += value;
             if(report.paymentStatus === 'PAID') {
               totalPaid += value;
             }
           }
        }
     });

     return {
       ...partner,
       totalClaimValue,
       totalPaid,
       outstanding: totalClaimValue - totalPaid
     };
  }).filter(p => p.totalClaimValue > 0).sort((a, b) => b.outstanding - a.outstanding);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">Analytics and Performance Metrics</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Partners" 
          value={partners.length} 
          icon={Users} 
          color="bg-blue-600" 
          onClick={() => navigate('/partners')}
        />
        <StatCard 
          title="Active Promotions" 
          value={activePromos} 
          icon={Tag} 
          color="bg-green-600" 
          onClick={() => navigate('/promotions')}
        />
        <StatCard 
          title="Managed SKUs" 
          value={skus.length} 
          icon={Package} 
          color="bg-purple-600" 
          onClick={() => navigate('/inventory')}
        />
        <StatCard 
          title="Units Sold" 
          value={totalUnitsSold} 
          icon={TrendingUp} 
          color="bg-orange-600" 
          onClick={() => navigate('/rebates')}
        />
      </div>

      {/* Partner Payout Overview Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
         <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
               <DollarSign size={20} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Partner Payout Overview</h3>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-900 font-semibold uppercase text-xs">
                <tr>
                  <th className="px-4 py-3">Partner</th>
                  <th className="px-4 py-3 text-right">Total Claims</th>
                  <th className="px-4 py-3 text-right">Paid Amount</th>
                  <th className="px-4 py-3 text-right">Outstanding Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {partnerBalances.length > 0 ? (
                  partnerBalances.map(p => (
                    <tr key={p._id} className="hover:bg-gray-50">
                       <td className="px-4 py-3 font-medium text-gray-900">
                         {p.name} <span className="text-[10px] text-gray-500 font-normal">({p.type})</span>
                       </td>
                       <td className="px-4 py-3 text-right">${p.totalClaimValue.toFixed(2)}</td>
                       <td className="px-4 py-3 text-right text-green-600">${p.totalPaid.toFixed(2)}</td>
                       <td className="px-4 py-3 text-right">
                          <span className={`font-bold ${p.outstanding > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                            ${p.outstanding.toFixed(2)}
                          </span>
                       </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                      No financial data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales by Partner Visualization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 size={20} className="text-blue-500" />
            Top Partners by Volume
          </h3>
          <div className="space-y-4">
            {salesByPartner.length > 0 ? (
              salesByPartner.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="text-gray-500">{item.total} units</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${(item.total / maxPartnerSales) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">No sales data available yet.</p>
            )}
          </div>
        </div>

        {/* Sales by SKU Visualization */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <PieChart size={20} className="text-purple-500" />
            Top Selling Products
          </h3>
          <div className="space-y-4">
            {salesBySKU.length > 0 ? (
              salesBySKU.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="text-gray-500">{item.total} sold</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div 
                      className="bg-purple-600 h-2.5 rounded-full transition-all duration-500" 
                      style={{ width: `${(item.total / maxSkuSales) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-400 py-8">No sales data available yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};