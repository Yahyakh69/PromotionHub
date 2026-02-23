import React, { useState } from 'react';
import { PromotionType } from '../types';
import { Plus, Calendar, Check, Trash2, X, Edit2, Tag, Search } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convexApi';

// --- Helper Component: Searchable SKU Selector ---
const SkuSearchableSelect = ({ skus, value, onChange }: { skus: any[], value: string, onChange: (val: string) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('');

  const selectedSku = skus.find(s => s._id === value);

  const filteredSkus = skus.filter(s => 
    s.name.toLowerCase().includes(filter.toLowerCase()) || 
    s.code.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="relative w-full">
       {!isOpen ? (
         <div 
           onClick={() => { setIsOpen(true); setFilter(''); }}
           className="w-full text-sm border border-gray-300 rounded p-1.5 bg-white cursor-pointer flex justify-between items-center hover:border-blue-400 group transition-colors"
           title="Click to search product"
         >
            <span className="truncate text-gray-800">
              {selectedSku ? `${selectedSku.name} (Org: $${selectedSku.originalPrice})` : <span className="text-gray-400">Select Product...</span>}
            </span>
            <Search size={14} className="text-gray-400 group-hover:text-blue-500 flex-shrink-0 ml-1" />
         </div>
       ) : (
         <div className="absolute top-0 left-0 w-full z-20">
            <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsOpen(false)}></div>
            <div className="relative z-20 bg-white rounded-md shadow-xl border border-blue-500 w-full min-w-[300px]">
               <div className="p-2 border-b border-gray-100 flex items-center gap-2 bg-blue-50 rounded-t-md">
                  <Search size={14} className="text-blue-600" />
                  <input 
                    autoFocus
                    type="text"
                    className="w-full text-sm bg-transparent outline-none text-gray-800 placeholder-gray-400"
                    placeholder="Type name or code..."
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  />
                  <button onClick={(e) => { e.stopPropagation(); setIsOpen(false); }} className="hover:bg-blue-200 rounded p-0.5 text-gray-500"><X size={14} /></button>
               </div>
               <ul className="max-h-60 overflow-y-auto py-1">
                  {filteredSkus.length > 0 ? filteredSkus.map(s => (
                    <li 
                      key={s._id}
                      onClick={() => { onChange(s._id); setIsOpen(false); }}
                      className="px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                    >
                       <div className="font-medium text-gray-900">{s.name}</div>
                       <div className="text-xs text-gray-500 flex justify-between mt-0.5">
                         <span className="font-mono bg-gray-100 px-1 rounded">{s.code}</span>
                         <span className="font-semibold text-gray-600">${s.originalPrice}</span>
                       </div>
                    </li>
                  )) : (
                    <li className="p-4 text-xs text-gray-400 text-center italic">No products found matching "{filter}"</li>
                  )}
               </ul>
            </div>
         </div>
       )}
    </div>
  );
};

export const Promotions: React.FC = () => {
  const promotions = useQuery(api.promotions.get) || [];
  const skus = useQuery(api.skus.get) || [];
  const createPromotion = useMutation(api.promotions.create);
  const updatePromotion = useMutation(api.promotions.update);
  const deletePromotion = useMutation(api.promotions.remove);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<PromotionType>(PromotionType.PROMO);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedItems, setSelectedItems] = useState<{skuId: string, promoPrice: number, rebateAmount: number}[]>([]);

  const handleOpenModal = (promo?: any) => {
    if (promo) {
      setEditingId(promo._id);
      setName(promo.name);
      setType(promo.type || PromotionType.PROMO);
      setStartDate(promo.startDate);
      setEndDate(promo.endDate);
      setSelectedItems([...promo.items]);
    } else {
      setEditingId(null);
      resetForm();
    }
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { skuId: '', promoPrice: 0, rebateAmount: 0 }]);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    // @ts-ignore
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const handleSave = async () => {
    if (!name || !startDate || !endDate) {
      alert("Please fill all required fields");
      return;
    }

    const validItems = selectedItems.filter(item => item.skuId);
    if (validItems.length === 0) {
       alert("Please add at least one valid product.");
       return;
    }

    try {
      const promoData = {
        name,
        type,
        startDate,
        endDate,
        items: validItems,
        status: 'ACTIVE',
        description: type === PromotionType.PRICE_DROP ? 'Price Drop Compensation' : 'Sales Promotion',
      };

      if (editingId) {
        await updatePromotion({ id: editingId, ...promoData });
      } else {
        await createPromotion(promoData);
      }
      setIsModalOpen(false);
      resetForm();
      setEditingId(null);
    } catch (e) {
      console.error(e);
      alert("Error saving promotion");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this promotion? This will affect historical rebate data.')) {
      await deletePromotion({ id });
    }
  };

  const resetForm = () => {
    setName('');
    setType(PromotionType.PROMO);
    setStartDate('');
    setEndDate('');
    setSelectedItems([]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-gray-100 text-gray-800';
      case 'COMPLETED': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Promotions & Price Drops</h2>
        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm">
          <Plus size={16} /> New Campaign
        </button>
      </div>

      <div className="space-y-4">
        {promotions.map((promo: any) => (
          <div key={promo._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900">{promo.name}</h3>
                  <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${promo.type === PromotionType.PRICE_DROP ? 'bg-orange-100 text-orange-700' : 'bg-purple-100 text-purple-700'}`}>
                    {promo.type || 'PROMO'}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {promo.startDate} to {promo.endDate}
                  </div>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(promo.status)}`}>
                    {promo.status}
                  </span>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="text-right mr-4">
                  <span className="text-sm font-medium text-gray-600 block">{promo.items.length} SKUs Included</span>
                </div>
                <button onClick={() => handleOpenModal(promo)} className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors p-2 rounded-full" title="Edit">
                  <Edit2 size={18} />
                </button>
                <button onClick={() => handleDelete(promo._id)} className="text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors p-2 rounded-full" title="Delete">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100">
               <h4 className="text-sm font-semibold text-gray-800 mb-2">Included Products:</h4>
               <ul className="text-sm text-gray-600 space-y-1">
                 {promo.items.map((item: any, idx: number) => {
                   const sku = skus.find((s: any) => s._id === item.skuId);
                   return sku ? (
                     <li key={idx} className="flex justify-between w-full max-w-lg border-b border-dashed border-gray-100 pb-1">
                       <span className="font-medium">{sku.name}</span>
                       <div className="flex gap-4">
                         <span className="text-gray-500 text-xs">Org: ${sku.originalPrice}</span>
                         <span className="text-red-600 font-medium">Promo: ${item.promoPrice}</span>
                         <span className="text-blue-600 font-medium text-xs bg-blue-50 px-1 rounded flex items-center">
                           DJI Comp: ${item.rebateAmount}
                         </span>
                       </div>
                     </li>
                   ) : null;
                 })}
               </ul>
            </div>
          </div>
        ))}
        {promotions.length === 0 && (
          <div className="text-center py-12 text-gray-400">No promotions created yet. Click "New Campaign" to start.</div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl shadow-2xl max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-gray-900">{editingId ? 'Edit Campaign' : 'Create New Campaign'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Campaign Name</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Pocket 3 Launch" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select 
                      className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white focus:ring-2 focus:ring-blue-500"
                      value={type} onChange={e => setType(e.target.value as PromotionType)}
                    >
                      <option value={PromotionType.PROMO}>Promotion (Sell-out)</option>
                      <option value={PromotionType.PRICE_DROP}>Price Drop (Protection)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                      value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input type="date" className="mt-1 block w-full border border-gray-300 rounded-md p-2" 
                      value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
                </div>
                
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex justify-between items-center mb-4">
                     <div>
                       <label className="block text-base font-semibold text-gray-800">Included SKUs & Compensation</label>
                       <p className="text-xs text-gray-500">Search products by Name or Code and define the DJI Compensation.</p>
                     </div>
                     <button onClick={handleAddItem} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1">
                       <Plus size={14} /> Add Product
                     </button>
                  </div>
                  
                  <div className="space-y-3 min-h-[150px]">
                     {selectedItems.map((item, index) => (
                       <div key={index} className="grid grid-cols-12 gap-2 items-start bg-gray-50 p-2 rounded border border-gray-100 shadow-sm">
                         <div className="col-span-5">
                           <SkuSearchableSelect 
                              skus={skus} 
                              value={item.skuId} 
                              onChange={(val) => updateItem(index, 'skuId', val)} 
                           />
                         </div>
                         <div className="col-span-3">
                           <div className="relative">
                             <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                             <input type="number" className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" 
                               placeholder="0.00" value={item.promoPrice} onChange={(e) => updateItem(index, 'promoPrice', Number(e.target.value))} />
                           </div>
                         </div>
                         <div className="col-span-3">
                           <div className="relative">
                             <span className="absolute left-2 top-1.5 text-gray-500 text-sm">$</span>
                             <input type="number" className="w-full pl-5 pr-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none" 
                               placeholder="69.00" value={item.rebateAmount} onChange={(e) => updateItem(index, 'rebateAmount', Number(e.target.value))} />
                           </div>
                         </div>
                         <div className="col-span-1 text-right pt-1.5">
                           <button onClick={() => {
                             const newI = [...selectedItems];
                             newI.splice(index, 1);
                             setSelectedItems(newI);
                           }} className="text-gray-400 hover:text-red-600 transition-colors p-1" title="Remove Item"><Trash2 size={16} /></button>
                         </div>
                       </div>
                     ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50 rounded-b-xl">
               <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors">Cancel</button>
               <button onClick={handleSave} className="px-5 py-2 bg-blue-600 text-white font-medium hover:bg-blue-700 rounded-lg shadow-md flex items-center gap-2">
                 <Check size={18} /> {editingId ? 'Update Campaign' : 'Publish Campaign'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};