import React from 'react';
import { Lock, Unlock } from 'lucide-react';
import type { Room } from '../services/api';

interface RoomCardProps {
  room: Room;
  onJoin: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({ room, onJoin }) => {
  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 hover:bg-white/20 transition-all duration-300 shadow-lg group">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-lg transition-colors ${room.hasPassword ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
            {room.hasPassword ? <Lock size={24} /> : <Unlock size={24} />}
        </div>
        <div className="text-xs font-medium text-gray-400 bg-black/20 px-2 py-1 rounded-full">
            ID: {room.id.slice(0, 4)}...
        </div>
      </div>
      
      <h3 className="text-xl font-bold text-white mb-1 truncate">{room.name}</h3>
      <p className={`text-sm mb-4 font-semibold ${room.isPublic ? 'text-emerald-500' : 'text-red-500'}`}>
        {room.isPublic ? 'Public Room' : 'Private Room'}
      </p>

      <button 
        onClick={() => onJoin(room)}
        className="block w-full text-center py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-md hover:shadow-blue-500/30"
      >
        Join Room
      </button>
    </div>
  );
};
