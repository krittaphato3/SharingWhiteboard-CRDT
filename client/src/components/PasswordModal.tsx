import React, { useState } from 'react';
import { X, Lock, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
  roomName: string;
}

export const PasswordModal: React.FC<PasswordModalProps> = ({ isOpen, onClose, onSubmit, roomName }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(password);
    setPassword('');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
        />

        <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-sm bg-gray-900 border border-white/10 rounded-2xl shadow-2xl p-6 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Lock size={20} className="text-purple-500" />
                Private Room
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                  <X size={24} />
              </button>
          </div>

          <p className="text-gray-400 text-sm mb-4">
            Enter the password to join <span className="text-white font-semibold">{roomName}</span>.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <input 
              type="password" 
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
              placeholder="Password"
            />
            
            <button 
                type="submit"
                className="w-full py-3 bg-purple-600 hover:bg-purple-500 rounded-xl text-white font-bold shadow-lg transition-all flex items-center justify-center gap-2"
            >
                Join Room <ArrowRight size={16} />
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
