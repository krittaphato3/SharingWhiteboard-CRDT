import React, { useState, useEffect } from 'react';
import { Plus, Search, Layers, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import type { Room, CreateRoomOptions } from '../services/api';
import { RoomCard } from '../components/RoomCard';
import { CreateRoomModal } from '../components/CreateRoomModal';
import { PasswordModal } from '../components/PasswordModal';

export const Lobby: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await api.getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    }
  };

  const handleCreateRoom = async (options: CreateRoomOptions) => {
    try {
      const { roomId, adminToken } = await api.createRoom(options);
      // Automatically join with admin token
      navigate(`/room/${roomId}?token=${adminToken}`);
    } catch (error) {
      console.error('Failed to create room:', error);
    }
  };

  const handleJoinRoom = async (room: Room) => {
      if (room.hasPassword) {
          setSelectedRoom(room);
      } else {
          // Public room - try to get a visitor/editor token via join or just go
          // Since it's public, we can just navigate. The backend will assign default permissions.
          // However, better practice is to "join" to get the explicit token if available.
          // For simplicity in this prototype, we'll try to join without password to get a token if possible,
          // or just navigate.
          try {
             // Try to join to get a token (if the API supports public join without password)
             // Our current API might expect password for private, but let's see.
             // Actually, the server /join endpoint expects `password` only if room has password.
             // Let's hit the join endpoint anyway to get the token.
             const res = await fetch(`http://localhost:1234/api/rooms/${room.id}/join`, {
                 method: 'POST',
                 headers: { 'Content-Type': 'application/json' },
                 body: JSON.stringify({})
             });
             const data = await res.json();
             if (data.token) {
                 navigate(`/room/${room.id}?token=${data.token}`);
             } else {
                 navigate(`/room/${room.id}`);
             }
          } catch (e) {
              navigate(`/room/${room.id}`);
          }
      }
  };

  const handlePasswordSubmit = async (password: string) => {
      if (!selectedRoom) return;
      try {
          const res = await fetch(`http://localhost:1234/api/rooms/${selectedRoom.id}/join`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });
            const data = await res.json();
            
            if (data.success && data.token) {
                navigate(`/room/${selectedRoom.id}?token=${data.token}`);
            } else {
                alert('Incorrect password');
            }
      } catch (error) {
          console.error('Join failed', error);
          alert('Failed to join room');
      }
  };

  const filteredRooms = rooms.filter(room => 
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen h-screen bg-gray-950 text-white relative overflow-hidden font-sans flex flex-col">
      {/* Background Blobs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      {/* Admin Link */}
      <Link to="/admin" className="absolute top-4 right-4 text-gray-600 hover:text-gray-400 z-50 transition-colors">
        <Shield size={16} />
      </Link>

      <div className="relative z-10 flex-1 flex flex-col max-w-7xl mx-auto w-full px-6 py-8">
        {/* Header */}
        <header className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6 pb-6 border-b border-white/5">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center md:text-left"
          >
            <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-2 tracking-tight">
            Whiteboard CRDT
            </h1>
            <p className="text-gray-400 text-xl font-light">Collaborate in real-time. Secure, fast, and infinite.</p>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-2xl font-bold text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_-10px_rgba(255,255,255,0.5)] transition-all"
          >
            <Plus size={24} />
            New Room
          </motion.button>
        </header>

        {/* Content Area */}
        <main className="flex-1 flex flex-col min-h-0">
             {/* Search */}
            <div className="flex items-center gap-4 mb-8 bg-white/5 border border-white/10 p-4 rounded-2xl backdrop-blur-sm shadow-lg">
                <Search className="text-gray-400 ml-2" size={24} />
                <input 
                    type="text" 
                    placeholder="Search active public rooms..." 
                    className="bg-transparent border-none focus:outline-none text-white w-full text-lg placeholder-gray-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Room Grid */}
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {rooms.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-white/5 rounded-3xl border border-dashed border-white/10">
                        <Layers size={64} className="text-gray-700 mb-6" />
                        <h3 className="text-2xl font-bold text-gray-500 mb-2">No Rooms Found</h3>
                        <p className="text-gray-600 max-w-md">The lobby is empty. Be the pioneer and create the first room to start collaborating!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                        {filteredRooms.map(room => (
                            <RoomCard key={room.id} room={room} onJoin={handleJoinRoom} />
                        ))}
                    </div>
                )}
            </div>
        </main>
      </div>

      <CreateRoomModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoom}
      />
      
      <PasswordModal
        isOpen={!!selectedRoom}
        onClose={() => setSelectedRoom(null)}
        onSubmit={handlePasswordSubmit}
        roomName={selectedRoom?.name || ''}
      />
    </div>
  );
};
