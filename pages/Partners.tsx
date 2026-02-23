import React, { useState } from 'react';
import { PartnerType } from '../types';
import { Plus, Trash2, Building2, Store, Edit2, Save, X, Percent } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convexApi';

export const Partners: React.FC = () => {
  const partners = useQuery(api.partners.get) || [];
  const createPartner = useMutation(api.partners.create);
  const updatePartner = useMutation(api.partners.update);
  const deletePartner = useMutation(api.partners.remove);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<any>({ 
    type: PartnerType.DEALER, 
    country: 'UAE',
    discountRate: 0
  });

  const handleOpenModal = (partner?: any) => {
    if (partner) {
      setEditingId(partner._id);
      setFormData({ ...partner });
    } else {
      setEditingId(null);
      setFormData({ type: PartnerType.DEALER, country: 'UAE', discountRate: 0 });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      alert("Name and Email are required");
      return;
    }

    try {
      const partnerData = {
        name: formData.name,
        email: formData.email,
        country: formData.country || 'UAE',
        type: formData.type || PartnerType.DEALER,
        discountRate: Number(formData.discountRate) || 0
      };

      if (editingId) {
        await updatePartner({ id: editingId, ...partnerData });
      } else {
        await createPartner(partnerData);
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error saving partner:", error);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this partner?')) {
      await deletePartner({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Partner & Trader Profiles</h2>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus size={16} /> Add Profile
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {partners.map((partner: any) => (
          <div key={partner._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col justify-between group hover:border-blue-300 transition-colors">
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-full ${partner.type === PartnerType.DEALER ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                   {partner.type === PartnerType.DEALER ? <Store size={20} /> : <Building2 size={20} />}
                </div>
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${partner.type === PartnerType.DEALER ? 'bg-indigo-50 text-indigo-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {partner.type}
                  </span>
                </div>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{partner.name}</h3>
              <p className="text-sm text-gray-500 mb-1">{partner.email}</p>
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">{partner.country}</p>
                <span className="text-xs font-semibold bg-gray-100 text-gray-700 px-2 py-1 rounded border border-gray-200" title="Margin / Discount Rate">
                  Margin: {partner.discountRate || 0}%
                </span>
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-2">
              <button 
                onClick={() => handleOpenModal(partner)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button 
                onClick={(e) => handleDelete(e, partner._id)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit Profile' : 'Register New Profile'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Company / Profile Name</label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as PartnerType})}>
                      <option value={PartnerType.DEALER}>Dealer</option>
                      <option value={PartnerType.TRADER}>Trader</option>
                    </select>
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700">Country</label>
                    <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                      value={formData.country || ''} onChange={e => setFormData({...formData, country: e.target.value})} />
                 </div>
              </div>
              
              <div>
                 <label className="block text-sm font-medium text-gray-700">
                    {formData.type === PartnerType.DEALER ? 'Dealer Discount (%)' : 'Trader Margin (%)'}
                 </label>
                 <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Percent size={14} className="text-gray-400" />
                    </div>
                    <input 
                      type="number" 
                      min="0" 
                      max="100"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500" 
                      value={formData.discountRate} 
                      onChange={e => setFormData({...formData, discountRate: Number(e.target.value)})} 
                    />
                 </div>
                 <p className="mt-1 text-xs text-gray-500">
                    Calculates rebate as: (Original Price - Promo Price) * (100% - Margin%)
                 </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email Contact</label>
                <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Save size={16} /> {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};