import React, { useState } from 'react';
import { X, Lock, Globe, Clock, Users, Shield, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CreateRoomOptions } from '../services/api';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (options: CreateRoomOptions) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [password, setPassword] = useState('');
  const [timeLimit, setTimeLimit] = useState(60);
  const [maxUsers, setMaxUsers] = useState<string>('');
  const [defaultRole, setDefaultRole] = useState<'editor' | 'visitor'>('editor');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
        name,
        password: isPrivate ? password : undefined,
        isPublic: !isPrivate,
        timeLimit,
        maxUsers: maxUsers ? parseInt(maxUsers) : undefined,
        defaultRole
    });
    setName('');
    setPassword('');
    setIsPrivate(false);
    setTimeLimit(60);
    setMaxUsers('');
    onClose();
  };

  if (!isOpen) return null;

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
            className="relative w-full max-w-xl bg-[#0f172a] border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-800 flex justify-between items-center bg-[#1e293b]">
              <div>
                  <h2 className="text-xl font-bold text-white">New Room</h2>
                  <p className="text-gray-400 text-xs">Configure your collaborative space</p>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors bg-white/5 p-2 rounded-full hover:bg-white/10">
                  <X size={20} />
              </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar space-y-6">
            
            {/* Room Name */}
            <div>
                <label className="block text-sm font-semibold text-gray-300 mb-2">Room Name</label>
                <input 
                    type="text" 
                    required
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="e.g. Daily Standup, Design Review"
                />
            </div>

            {/* Privacy & Role Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Privacy */}
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Access Type</label>
                    <div className="flex bg-[#1e293b] p-1 rounded-xl border border-gray-700">
                        <button
                            type="button"
                            onClick={() => setIsPrivate(false)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${!isPrivate ? 'bg-blue-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <Globe size={16} /> Public
                        </button>
                        <button
                            type="button"
                            onClick={() => setIsPrivate(true)}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${isPrivate ? 'bg-purple-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <Lock size={16} /> Private
                        </button>
                    </div>
                </div>

                 {/* Default Role */}
                 <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2">Default Permission</label>
                    <div className="flex bg-[#1e293b] p-1 rounded-xl border border-gray-700">
                        <button
                            type="button"
                            onClick={() => setDefaultRole('editor')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${defaultRole === 'editor' ? 'bg-emerald-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <Shield size={16} /> Editor
                        </button>
                        <button
                            type="button"
                            onClick={() => setDefaultRole('visitor')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${defaultRole === 'visitor' ? 'bg-amber-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
                        >
                            <Users size={16} /> Visitor
                        </button>
                    </div>
                </div>
            </div>

            {/* Password Input (Animated) */}
            <AnimatePresence>
                {isPrivate && (
                     <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                     >
                        <label className="block text-sm font-semibold text-purple-400 mb-2">Room Password</label>
                        <input 
                            type="password" 
                            required={isPrivate}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-[#1e293b] border border-purple-500/50 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                            placeholder="Set a secure password..."
                        />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Limits Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Time Limit */}
                 <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" /> Auto-Delete In
                    </label>
                    <div className="relative">
                        <select 
                            value={timeLimit}
                            onChange={(e) => setTimeLimit(Number(e.target.value))}
                            className="w-full px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer hover:bg-[#28364d] transition-colors"
                        >
                            <option value={10}>10 Minutes</option>
                            <option value={30}>30 Minutes</option>
                            <option value={60}>1 Hour</option>
                            <option value={120}>2 Hours</option>
                            <option value={1440}>24 Hours</option>
                            <option value={0}>Never (Infinity)</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                    </div>
                </div>

                {/* Max Users */}
                <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-2 flex items-center gap-2">
                        <Users size={16} className="text-gray-400" /> Max Participants
                    </label>
                    <input 
                        type="number" 
                        min="1"
                        value={maxUsers}
                        onChange={(e) => setMaxUsers(e.target.value)}
                        className="w-full px-4 py-3 bg-[#1e293b] border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="Unlimited (Default)"
                    />
                </div>
            </div>

          </form>

           {/* Footer */}
           <div className="p-6 border-t border-gray-800 bg-[#1e293b]">
                <button 
                    onClick={handleSubmit}
                    className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-xl text-white font-bold shadow-lg shadow-blue-500/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                >
                    <Check size={20} /> Create Room
                </button>
           </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
