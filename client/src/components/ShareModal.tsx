import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Link as LinkIcon, Edit3, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  roomId: string;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, roomId }) => {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'visitor'>('editor');
  const [tokens, setTokens] = useState<{ adminToken?: string; visitorToken?: string }>({});
  
  useEffect(() => {
    if (isOpen) {
        api.getRoom(roomId).then(room => {
            setTokens({
                adminToken: room.adminToken,
                visitorToken: room.visitorToken
            });
        }).catch(console.error);
    }
  }, [isOpen, roomId]);
  
  const baseUrl = `${window.location.origin}/room/${roomId}`;
  
  // Construct URL with tokens
  let shareUrl = baseUrl;
  if (activeTab === 'editor' && tokens.adminToken) {
      shareUrl += `?token=${tokens.adminToken}`;
  } else if (activeTab === 'visitor' && tokens.visitorToken) {
      shareUrl += `?token=${tokens.visitorToken}`;
  } else {
      // Fallback for public rooms or if fetch failed
      if (activeTab === 'visitor') shareUrl += '?role=visitor';
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
        />

        <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <LinkIcon size={20} className="text-blue-600" />
                Share Room
              </h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={24} />
              </button>
          </div>

          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'editor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  <Edit3 size={16} />
                  Editor
              </button>
              <button
                onClick={() => setActiveTab('visitor')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'visitor' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                  <Eye size={16} />
                  Visitor
              </button>
          </div>

          <p className="text-gray-500 text-sm mb-4">
            {activeTab === 'editor' 
                ? 'Generate a secure link with full editing permissions.' 
                : 'Generate a read-only link. Users cannot edit the canvas.'}
          </p>

          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
            <input 
              type="text" 
              readOnly 
              value={shareUrl} 
              className="bg-transparent border-none focus:outline-none flex-1 text-gray-600 text-sm px-2 truncate"
            />
            <button 
              onClick={copyToClipboard}
              className={`p-2 rounded-md transition-all ${copied ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'}`}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
