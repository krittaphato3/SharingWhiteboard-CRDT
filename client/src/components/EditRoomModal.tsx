import React, { useState, useEffect } from 'react';
import { X, Save, Clock, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Room } from '../services/api';

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, data: any) => void;
  room: Room | null;
}

export const EditRoomModal: React.FC<EditRoomModalProps> = ({ isOpen, onClose, onSave, room }) => {
  const [name, setName] = useState('');
  const [maxUsers, setMaxUsers] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [extendTime, setExtendTime] = useState(0);

  useEffect(() => {
    if (room) {
        setName(room.name);
        setMaxUsers(room.maxUsers === null || room.maxUsers === undefined ? '' : room.maxUsers.toString());
        setIsPrivate(!room.isPublic);
        setPassword('');
        setExtendTime(0);
    }
  }, [room]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!room) return;

    const updates: any = {
        name,
        maxUsers: maxUsers ? parseInt(maxUsers) : 0,
        isPublic: !isPrivate,
    };

    if (password) {
        updates.password = password;
    }
    
    if (extendTime !== 0) {
        updates.extendTime = extendTime;
    }

    onSave(room.id, updates);
    onClose();
  };

  if (!isOpen || !room) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        />

        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-lg bg-[#0f172a] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="px-6 py-5 bg-[#1e293b] border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">Edit Configuration</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
              </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Room Name</label>
                <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Users size={16} className="text-gray-400" /> Max Users
                    </label>
                    <input 
                        type="number" 
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(e.target.value)}
                        placeholder="Unlimited"
                        className="w-full px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                </div>
                 <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" /> Extend Time
                    </label>
                    <div className="relative">
                        <select
                            value={extendTime}
                            onChange={(e) => setExtendTime(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-all cursor-pointer"
                        >
                            <option value={0}>No Change</option>
                            <option value={10}>+ 10 Mins</option>
                            <option value={30}>+ 30 Mins</option>
                            <option value={60}>+ 1 Hour</option>
                            <option value={1440}>+ 1 Day</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                </div>
            </div>

            <div className="bg-[#1e293b] p-4 rounded-xl border border-gray-700">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex flex-col">
                        <label className="text-sm font-semibold text-gray-300">Password Protection</label>
                        <span className="text-xs text-gray-500">{isPrivate ? 'Enabled - Room is Private' : 'Disabled - Room is Public'}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setIsPrivate(!isPrivate)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${isPrivate ? 'bg-purple-600' : 'bg-gray-600'}`}
                    >
                        <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPrivate ? 'translate-x-6' : 'translate-x-1'}`}
                        />
                    </button>
                </div>
                
                <AnimatePresence>
                    {isPrivate && (
                        <motion.div
                            initial={{ height: 0, opacity: 0, marginTop: 0 }}
                            animate={{ height: 'auto', opacity: 1, marginTop: 12 }}
                            exit={{ height: 0, opacity: 0, marginTop: 0 }}
                            className="overflow-hidden"
                        >
                            <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-1">New Room Password</label>
                            <input 
                                type="text" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password..."
                                className="w-full px-4 py-2.5 bg-black/30 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            />
                            <p className="text-[10px] text-gray-500 mt-1 italic">Leave empty to keep existing password.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <button 
                type="submit"
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2 mt-2"
            >
                <Save size={18} /> Save Changes
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};