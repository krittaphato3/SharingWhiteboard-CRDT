import React, { useEffect, useState } from 'react';
import { Trash2, Clock, Users, ArrowLeft, Search, Edit, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Room } from '../services/api';
import { EditRoomModal } from '../components/EditRoomModal';
import { DeleteConfirmModal } from '../components/DeleteConfirmModal';

export const AdminPage: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [deletingRoom, setDeletingRoom] = useState<Room | null>(null);
  
  // Stats
  const totalRooms = rooms.length;
  const activeUsers = rooms.reduce((acc, r) => acc + (r.maxUsers && r.maxUsers < 1000 ? Math.floor(Math.random() * 5) : 0), 0); // Mock active users for now

  const fetchAdminRooms = async () => {
    setLoading(true);
    try {
      const data = await api.getAllRoomsAdmin();
      setRooms(data);
      setFilteredRooms(data);
    } catch (error) {
      console.error('Failed to fetch admin rooms', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminRooms();
  }, []);

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const filtered = rooms.filter(r => 
        r.name.toLowerCase().includes(lower) || 
        r.id.toLowerCase().includes(lower)
    );
    setFilteredRooms(filtered);
  }, [searchTerm, rooms]);

  const confirmDelete = async () => {
    if (!deletingRoom) return;
    try {
        await api.deleteRoom(deletingRoom.id);
        fetchAdminRooms();
    } catch (error) {
        console.error('Delete failed', error);
        alert('Failed to delete room. Check console for details.');
    } finally {
        setDeletingRoom(null);
    }
  };

  const handleUpdate = async (id: string, data: any) => {
      try {
          await api.updateRoom(id, data);
          fetchAdminRooms(); // Refresh list
      } catch (error) {
          alert('Failed to update room');
      }
  };


  const formatTime = (seconds?: number) => {
      if (!seconds && seconds !== 0) return '∞';
      if (seconds <= 0) return 'Expired';
      const mins = Math.floor(seconds / 60);
      const hours = Math.floor(mins / 60);
      if (hours > 0) return `${hours}h ${mins % 60}m`;
      return `${mins} min`;
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Stats */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-4">
                <Link to="/" className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">Admin Dashboard</h1>
                    <p className="text-gray-400 text-sm">Manage active sessions and configurations</p>
                </div>
            </div>
            
            <div className="flex gap-4">
                <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-xl flex flex-col items-center min-w-[100px]">
                    <span className="text-2xl font-bold text-blue-400">{totalRooms}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Active Rooms</span>
                </div>
                {/* Mock Stat */}
                 <div className="bg-white/5 border border-white/10 px-5 py-3 rounded-xl flex flex-col items-center min-w-[100px]">
                    <span className="text-2xl font-bold text-purple-400">{activeUsers}</span>
                    <span className="text-xs text-gray-500 uppercase tracking-wider">Est. Users</span>
                </div>
            </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 items-center bg-gray-900/50 p-4 rounded-2xl border border-white/10">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                <input 
                    type="text" 
                    placeholder="Search by Room Name or ID..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
            </div>
            <button 
                onClick={fetchAdminRooms}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-gray-400 hover:text-white transition-colors"
                title="Refresh"
            >
                <RefreshCw size={20} />
            </button>
        </div>

        {/* Table */}
        <div className="bg-gray-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/5 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        <tr>
                            <th className="px-6 py-4">Room Name</th>
                            <th className="px-6 py-4">ID / Type</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Limits</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500 animate-pulse">Loading data...</td>
                            </tr>
                        ) : filteredRooms.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No rooms found matching your criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredRooms.map(room => (
                                <tr key={room.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-white">{room.name}</div>
                                        <div className="text-xs text-gray-500 mt-1">Created: {new Date(room.createdAt || 0).toLocaleDateString()}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-xs text-gray-500 bg-black/20 px-2 py-1 rounded w-fit mb-1">{room.id.slice(0, 8)}</div>
                                        <div className={`text-xs font-medium ${room.isPublic ? 'text-green-400' : 'text-purple-400'}`}>
                                            {room.isPublic ? 'Public' : 'Private'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Clock size={16} className={room.timeLeft && room.timeLeft < 300 ? 'text-red-400' : 'text-gray-500'} />
                                            <span>{formatTime(room.timeLeft)}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                         <div className="flex items-center gap-2 text-sm text-gray-300">
                                            <Users size={16} className="text-gray-500" />
                                            <span>{room.maxUsers || '∞'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => setEditingRoom(room)}
                                                className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors border border-blue-500/20"
                                                title="Edit Configuration"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button 
                                                onClick={() => setDeletingRoom(room)}
                                                className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors border border-red-500/20"
                                                title="Force Delete"
                                            >
                                                <Trash2 size={16} />
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
      </div>

      <EditRoomModal 
        isOpen={!!editingRoom}
        room={editingRoom}
        onClose={() => setEditingRoom(null)}
        onSave={handleUpdate}
      />

      <DeleteConfirmModal 
        isOpen={!!deletingRoom}
        roomName={deletingRoom?.name || ''}
        onClose={() => setDeletingRoom(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
};