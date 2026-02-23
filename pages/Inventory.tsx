import React, { useState } from 'react';
import { Plus, Upload, Trash2, Search, Edit2, Save, X, RotateCw } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convexApi';

export const Inventory: React.FC = () => {
  const skus = useQuery(api.skus.get) || [];
  const createSku = useMutation(api.skus.create);
  const updateSku = useMutation(api.skus.update);
  const deleteSku = useMutation(api.skus.remove);
  const deleteSkusBatch = useMutation(api.skus.removeBatch);
  const createSkusBatch = useMutation(api.skus.createBatch);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Use 'any' to allow string storage for number fields during editing
  const [formData, setFormData] = useState<any>({
    code: '',
    name: '',
    category: '',
    originalPrice: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  const handleOpenModal = (sku?: any) => {
    if (sku) {
      setEditingId(sku._id);
      setFormData({ 
        ...sku,
        originalPrice: sku.originalPrice?.toString() || '' 
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        name: '',
        category: '',
        originalPrice: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    // Basic Validation
    if (!formData.code || !formData.name) {
      alert("SKU Code and Name are required.");
      return;
    }

    // Safe Number Parsing
    let price = 0;
    try {
      price = parseFloat(String(formData.originalPrice));
    } catch (e) {
      price = 0;
    }

    if (isNaN(price)) {
      alert("Please enter a valid numeric price.");
      return;
    }
    
    setIsSaving(true);

    // Timeout Promise to prevent infinite looping if backend is unreachable
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error("Operation timed out. Please check your internet connection.")), 10000)
    );

    try {
      const dataPayload = {
        code: formData.code,
        name: formData.name,
        category: formData.category || 'General',
        originalPrice: price,
      };

      if (editingId) {
        await Promise.race([
          updateSku({ id: editingId as any, ...dataPayload }),
          timeoutPromise
        ]);
      } else {
        await Promise.race([
          createSku(dataPayload),
          timeoutPromise
        ]);
      }
      setIsModalOpen(false);
    } catch (error: any) {
      console.error("Failed to save SKU:", error);
      alert(error.message || "Error saving SKU. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this SKU?')) {
      try {
        await deleteSku({ id: id as any });
      } catch (e) {
        alert("Failed to delete item.");
      }
    }
  };

  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds) as string[];
    if (idsToDelete.length === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${idsToDelete.length} selected SKUs?`)) {
      try {
        await deleteSkusBatch({ ids: idsToDelete as any });
        setSelectedIds(new Set());
      } catch (error) {
        console.error("Bulk delete failed", error);
        alert("Failed to delete items.");
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target?.result as string;
      if (!text) {
        alert("Empty file");
        return;
      }
      
      const lines = text.split(/\r?\n/);
      const newSkus: any[] = [];
      
      const startIndex = lines[0].toLowerCase().includes('code') ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const parts = line.split(',');
        if (parts.length >= 3) {
             const code = parts[0].trim();
             const name = parts[1].trim();
             const category = parts[2].trim();
             const price = parseFloat(parts[3]?.trim() || '0');

             if (code && name) {
               newSkus.push({
                 code,
                 name,
                 category: category || 'General',
                 originalPrice: isNaN(price) ? 0 : price
               });
             }
        }
      }

      if (newSkus.length > 0) {
        try {
            await createSkusBatch({ skus: newSkus });
            alert(`Successfully imported ${newSkus.length} SKUs.`);
        } catch (e) {
            console.error(e);
            alert("Error importing SKUs");
        }
      } else {
        alert("No valid SKUs found in file.");
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const filteredSkus = skus.filter((s: any) => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = filteredSkus.map((s: any) => s._id);
      setSelectedIds(new Set(allIds));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(id)) {
        newSelected.delete(id);
      } else {
        newSelected.add(id);
      }
      return newSelected;
    });
  };

  const isAllSelected = filteredSkus.length > 0 && filteredSkus.every((s: any) => selectedIds.has(s._id));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Inventory Management</h2>
        <div className="flex gap-2">
          {selectedIds.size > 0 && (
            <button 
              type="button"
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-200 shadow-sm animate-in fade-in"
            >
              <Trash2 size={16} /> Delete ({selectedIds.size})
            </button>
          )}
          
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer shadow-sm">
            <Upload size={16} />
            Import CSV
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button 
            type="button"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
          >
            <Plus size={16} /> Add SKU
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200">
           <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by Code or Name..." 
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
           </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4">SKU Code</th>
                <th className="px-6 py-4">Product Name</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Original Price ($)</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSkus.map((sku: any) => (
                <tr key={sku._id} className={`hover:bg-gray-50 group ${selectedIds.has(sku._id) ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4">
                     <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                      checked={selectedIds.has(sku._id)}
                      onChange={() => handleSelectRow(sku._id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">{sku.code}</td>
                  <td className="px-6 py-4">{sku.name}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {sku.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium">${sku.originalPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(sku)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                        <Edit2 size={18} />
                      </button>
                      <button 
                        onClick={(e) => handleDelete(e, sku._id)} 
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        type="button"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSkus.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No SKUs found. Add manually or import via CSV.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{editingId ? 'Edit SKU' : 'Add New SKU'}</h3>
              <button 
                type="button" 
                onClick={() => !isSaving && setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                disabled={isSaving}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">SKU Code</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.code || ''} 
                  onChange={e => setFormData({...formData, code: e.target.value})}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Product Name</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.name || ''} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Category</label>
                <input 
                  type="text" 
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.category || ''} 
                  onChange={e => setFormData({...formData, category: e.target.value})}
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Original Price ($)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.originalPrice} 
                  onChange={e => setFormData({...formData, originalPrice: e.target.value})}
                  disabled={isSaving}
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)} 
                className="px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={handleSave} 
                disabled={isSaving}
                className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 ${isSaving ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSaving ? <RotateCw className="animate-spin" size={16} /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Save SKU'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};