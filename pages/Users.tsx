import React, { useState } from 'react';
import { UserRole } from '../types';
import { Plus, Trash2, Edit2, Save, X, Shield, User as UserIcon, Building2 } from 'lucide-react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../convexApi';

export const UsersPage: React.FC = () => {
  const users = useQuery(api.users.get) || [];
  const partners = useQuery(api.partners.get) || [];
  
  const createUser = useMutation(api.users.create);
  const updateUser = useMutation(api.users.update);
  const deleteUser = useMutation(api.users.remove);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState<any>({
    role: 'PARTNER',
    partnerId: ''
  });

  const handleOpenModal = (user?: any) => {
    if (user) {
      setEditingId(user._id);
      setFormData({ 
        name: user.name,
        email: user.email,
        role: user.role,
        partnerId: user.partnerId || '',
        password: user.password
      });
    } else {
      setEditingId(null);
      setFormData({
        role: 'PARTNER',
        partnerId: '',
        name: '',
        email: '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email || !formData.password) {
      alert("Name, Email, and Password are required.");
      return;
    }

    if (formData.role === 'PARTNER' && !formData.partnerId) {
      alert("Please link a Partner Company to this user.");
      return;
    }

    try {
      if (editingId) {
        await updateUser({
          id: editingId as any,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          partnerId: formData.partnerId,
          password: formData.password
        });
      } else {
        // Simple client-side check for duplicate emails
        if (users.some((u: any) => u.email.toLowerCase() === formData.email?.toLowerCase())) {
          alert("A user with this email already exists.");
          return;
        }
        await createUser({
          name: formData.name!,
          email: formData.email!,
          role: formData.role,
          partnerId: formData.partnerId,
          password: formData.password!
        });
      }
      setIsModalOpen(false);
    } catch (e) {
      console.error(e);
      alert("Error saving user.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this user? They will no longer be able to log in.")) {
      await deleteUser({ id: id as any });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
           <p className="text-gray-500 text-sm">Manage login credentials for Admins and Partners.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-sm"
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 text-gray-900 font-semibold uppercase text-xs">
              <tr>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Linked Partner</th>
                <th className="px-6 py-4">Password</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user: any) => {
                const linkedPartner = partners.find((p: any) => p._id === user.partnerId);
                return (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                         <div className="p-2 rounded-full bg-gray-100">
                           <UserIcon size={16} className="text-gray-600" />
                         </div>
                         <div>
                           <div className="font-medium text-gray-900">{user.name}</div>
                           <div className="text-gray-500 text-xs">{user.email}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {user.role === 'ADMIN' ? <Shield size={12} /> : <Building2 size={12} />}
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {linkedPartner ? (
                        <span className="text-gray-900">{linkedPartner.name}</span>
                      ) : (
                        <span className="text-gray-400 italic">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {user.password}
                    </td>
                    <td className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                          <button onClick={() => handleOpenModal(user)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                            <Edit2 size={18} />
                          </button>
                          <button onClick={() => handleDelete(user._id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                            <Trash2 size={18} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                        No users found in database. 
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
              <h3 className="text-lg font-bold">{editingId ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                <input type="email" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <input type="text" className="mt-1 block w-full border border-gray-300 rounded-md p-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                  value={formData.password || ''} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                   value={formData.role} 
                   onChange={e => setFormData({...formData, role: e.target.value as UserRole})}
                >
                   <option value="PARTNER">Partner User</option>
                   <option value="ADMIN">Super Admin</option>
                </select>
              </div>

              {formData.role === 'PARTNER' && (
                <div>
                   <label className="block text-sm font-medium text-gray-700">Linked Partner Company</label>
                   <select className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                     value={formData.partnerId} 
                     onChange={e => setFormData({...formData, partnerId: e.target.value})}
                   >
                     <option value="">-- Select Partner --</option>
                     {partners.map((p: any) => (
                       <option key={p._id} value={p._id}>{p.name}</option>
                     ))}
                   </select>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:text-gray-800">Cancel</button>
              <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                <Save size={16} /> Save User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};