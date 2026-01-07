const API_URL = 'http://localhost:1234/api';

export interface Room {
  id: string;
  name: string;
  isPublic: boolean;
  hasPassword?: boolean;
  defaultRole: 'editor' | 'visitor';
  maxUsers: number;
  timeLeft?: number; // In seconds
  createdAt?: number;
  adminToken?: string;
  visitorToken?: string;
}

export interface CreateRoomOptions {
    name: string;
    password?: string;
    isPublic: boolean;
    timeLimit: number; // minutes
    maxUsers?: number;
    defaultRole: 'editor' | 'visitor';
    ownerId?: string;
}

export const api = {
  getRooms: async (): Promise<Room[]> => {
    const res = await fetch(`${API_URL}/rooms`);
    if (!res.ok) throw new Error('Failed to fetch rooms');
    return res.json();
  },

  getAllRoomsAdmin: async (secret: string = 'super-secret-admin-key'): Promise<Room[]> => {
      const res = await fetch(`${API_URL}/admin/rooms`, {
          headers: { 'X-Admin-Secret': secret }
      });
      if (!res.ok) throw new Error('Failed to fetch admin rooms');
      return res.json();
  },

  createRoom: async (options: CreateRoomOptions): Promise<{ roomId: string; ownerId: string; adminToken: string; visitorToken: string }> => {
    const res = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options),
    });
    if (!res.ok) throw new Error('Failed to create room');
    return res.json();
  },

  getRoom: async (id: string): Promise<Room> => {
    const res = await fetch(`${API_URL}/rooms/${id}`);
    if (!res.ok) throw new Error('Room not found');
    return res.json();
  },
  
  checkPassword: async (id: string, password: string): Promise<boolean> => {
    const res = await fetch(`${API_URL}/rooms/${id}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
    });
    return res.ok;
  },

  deleteRoom: async (id: string, secret: string = 'super-secret-admin-key'): Promise<void> => {
      const res = await fetch(`${API_URL}/rooms/${id}`, {
          method: 'DELETE',
          headers: { 
              'Content-Type': 'application/json',
              'X-Admin-Secret': secret 
            },
      });
      if (!res.ok) throw new Error('Failed to delete room');
  },

  updateRoom: async (id: string, data: any, secret: string = 'super-secret-admin-key'): Promise<void> => {
      const res = await fetch(`${API_URL}/rooms/${id}`, {
          method: 'PATCH',
          headers: { 
              'Content-Type': 'application/json',
              'X-Admin-Secret': secret 
            },
          body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error('Failed to update room');
  }
};