import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  roomName: string;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ isOpen, onClose, onConfirm, roomName }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-md"
            onClick={onClose}
        />

        {/* Modal */}
        <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className="relative w-full max-w-md bg-[#0f172a] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-6 text-center">
              <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                  <AlertTriangle size={32} className="text-red-500" />
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Delete Room?</h3>
              <p className="text-gray-400 text-sm mb-6">
                  Are you sure you want to delete <span className="text-white font-semibold">"{roomName}"</span>?<br/>
                  This action cannot be undone and all drawing data will be lost.
              </p>

              <div className="flex gap-3">
                  <button 
                      onClick={onClose}
                      className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-gray-300 font-medium transition-colors border border-white/5"
                  >
                      Cancel
                  </button>
                  <button 
                      onClick={() => {
                          onConfirm();
                          onClose();
                      }}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold shadow-lg shadow-red-500/20 transition-colors"
                  >
                      Delete Forever
                  </button>
              </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
