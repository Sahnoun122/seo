import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUsers, updateUserCredits, deleteUserAccount } from '../../lib/api';
import DashboardLayout from '../../components/DashboardLayout';
import {
  Users,
  Search,
  ShieldAlert,
  Coins,
  Trash2,
  X,
  Loader2,
  Calendar,
  Mail,
  Shield,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCreditModalOpen, setIsCreditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [creditAmount, setCreditAmount] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, [pagination.page]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetchUsers(pagination.page, pagination.limit);
      if (res.success) {
        setUsers(res.data.users);
        setPagination(res.data.pagination);
      } else {
        toast.error('Échec du chargement des utilisateurs');
      }
    } catch (error) {
      toast.error('Erreur réseau lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCredits = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;
    
    setActionLoading(true);
    try {
      const res = await updateUserCredits(selectedUser._id, creditAmount);
      if (res.success) {
        toast.success(`Crédits mis à jour avec succès !`);
        setUsers(users.map(u => u._id === selectedUser._id ? { ...u, credits: creditAmount } : u));
        setIsCreditModalOpen(false);
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour des crédits');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    setActionLoading(true);
    try {
      const res = await deleteUserAccount(selectedUser._id);
      if (res.success) {
        toast.success(`Utilisateur supprimé définitivement`);
        setUsers(users.filter(u => u._id !== selectedUser._id));
        setIsDeleteModalOpen(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    } finally {
      setActionLoading(false);
    }
  };

  const openCreditModal = (user) => {
    setSelectedUser(user);
    setCreditAmount(user.credits);
    setIsCreditModalOpen(true);
  };

  const openDeleteModal = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 text-white shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-red-600/20 rounded-full blur-[100px] animate-pulse" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10 mb-2">
                <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-100">Super Admin Zone</span>
              </div>
              <h1 className="text-4xl font-black tracking-tight">
                Gestion des <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-red-600">Utilisateurs</span>
              </h1>
              <p className="text-gray-400 font-medium">Administrez les accès, gérez les crédits IA et supervisez la plateforme.</p>
            </div>

            <div className="flex items-center space-x-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="text-center">
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Total Users</p>
                <p className="text-3xl font-black text-white">{pagination.total}</p>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="text-center">
                <Users className="w-8 h-8 text-red-500 opacity-80" />
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="premium-card bg-white p-2 border border-gray-100 shadow-xl shadow-gray-200/50 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-gray-500" />
              Liste des utilisateurs
            </h2>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Rechercher..." 
                className="pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all w-64 outline-none"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="text-xs text-gray-400 uppercase bg-gray-50/50 font-black tracking-wider">
                <tr>
                  <th className="px-6 py-4">Utilisateur</th>
                  <th className="px-6 py-4">Rôle</th>
                  <th className="px-6 py-4">Crédits IA</th>
                  <th className="px-6 py-4">Inscription</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="border-b border-gray-50">
                      <td className="px-6 py-4"><div className="h-10 w-48 bg-gray-100 rounded-lg animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-16 bg-gray-100 rounded-full animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-gray-100 rounded-full animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-24 bg-gray-100 rounded-lg animate-pulse" /></td>
                      <td className="px-6 py-4"><div className="h-8 w-32 ml-auto bg-gray-100 rounded-xl animate-pulse" /></td>
                    </tr>
                  ))
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      Aucun utilisateur trouvé.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <motion.tr 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={u._id} 
                      className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${u.role === 'admin' ? 'bg-red-100 text-red-600' : 'bg-primary-100 text-primary-600'}`}>
                            {u.name?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" /> {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
                          u.role === 'admin' 
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-gray-100 text-gray-600 border border-gray-200'
                        }`}>
                          {u.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-amber-500" />
                          <span className="font-black text-gray-900">{u.credits}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-500">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(u.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => openCreditModal(u)}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-xl transition-colors tooltip-trigger"
                            title="Gérer les crédits"
                          >
                            <Coins className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => openDeleteModal(u)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors tooltip-trigger"
                            title="Supprimer le compte"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {!loading && pagination.pages > 1 && (
            <div className="p-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-500">Page {pagination.page} sur {pagination.pages}</p>
              <div className="flex gap-2">
                <button 
                  disabled={pagination.page === 1}
                  onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  disabled={pagination.page === pagination.pages}
                  onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Credit Modal */}
      <AnimatePresence>
        {isCreditModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[100]"
              onClick={() => setIsCreditModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Coins className="w-5 h-5 text-primary-500" />
                  Gérer les crédits
                </h3>
                <button onClick={() => setIsCreditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleUpdateCredits} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Utilisateur
                  </label>
                  <p className="text-gray-900 font-bold">{selectedUser?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau solde de crédits
                  </label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="number" 
                      min="0"
                      value={creditAmount}
                      onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-lg font-black outline-none"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setIsCreditModalOpen(false)}
                    className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={actionLoading}
                    className="px-5 py-2.5 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-primary-500/30"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Enregistrer
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-red-900/20 backdrop-blur-sm z-[100]"
              onClick={() => setIsDeleteModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-8 text-center space-y-6">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-10 h-10 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Supprimer ce compte ?</h3>
                  <p className="text-gray-500 text-sm">
                    Vous êtes sur le point de supprimer définitivement le compte de <span className="font-bold text-gray-900">{selectedUser?.email}</span>. Cette action est irréversible.
                  </p>
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    onClick={handleDeleteUser}
                    disabled={actionLoading}
                    className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/30"
                  >
                    {actionLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                    Oui, supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
