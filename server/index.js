const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const setupWSConnection = require('y-websocket/bin/utils').setupWSConnection;

const app = express();
const port = process.env.PORT || 1234;
const ADMIN_SECRET = 'super-secret-admin-key';

// Middleware
app.use(cors({
    origin: '*', // In production, restrict this
    allowedHeaders: ['Content-Type', 'X-Admin-Secret']
}));
app.use(express.json());

// In-memory Room Storage
const rooms = new Map();
const expirationTimers = new Map();

const deleteRoom = (roomId) => {
    if (rooms.has(roomId)) {
        rooms.delete(roomId);
        const timer = expirationTimers.get(roomId);
        if (timer) {
            clearTimeout(timer);
            expirationTimers.delete(roomId);
        }
        console.log(`Room deleted: ${roomId}`);
    }
};

// --- API Endpoints ---

app.get('/api/rooms', (req, res) => {
  const publicRooms = Array.from(rooms.values())
    .filter(room => room.isPublic)
    .map(({ password, ownerId, adminToken, visitorToken, ...room }) => room);
  res.json(publicRooms);
});

app.get('/api/admin/rooms', (req, res) => {
    const allRooms = Array.from(rooms.values()).map(room => {
        let timeLeft = null;
        if (room.expiry) {
            timeLeft = Math.max(0, Math.ceil((room.expiry - Date.now()) / 1000));
        }
        return { ...room, timeLeft };
    });
    res.json(allRooms);
});

app.post('/api/rooms', (req, res) => {
  const { name, password, isPublic, timeLimit, maxUsers, defaultRole, ownerId } = req.body;
  
  if (!name) return res.status(400).json({ error: 'Room name is required' });

  const roomId = uuidv4();
  const adminToken = uuidv4();
  const visitorToken = uuidv4();
  const now = Date.now();
  
  let expiry = null;
  if (timeLimit && timeLimit > 0) {
      expiry = now + (timeLimit * 60 * 1000);
      const timer = setTimeout(() => deleteRoom(roomId), timeLimit * 60 * 1000);
      expirationTimers.set(roomId, timer);
  }

  const newRoom = {
    id: roomId,
    name,
    ownerId: ownerId || 'anonymous',
    password: password || null,
    isPublic: isPublic !== undefined ? isPublic : true,
    maxUsers: maxUsers ? parseInt(maxUsers) : Infinity,
    defaultRole: defaultRole || 'editor',
    expiry,
    createdAt: now,
    adminToken,
    visitorToken
  };

  rooms.set(roomId, newRoom);
  console.log(`Room created: ${name} (${roomId})`);
  
  // Return tokens so the creator can share them
  res.status(201).json({ roomId, ownerId: newRoom.ownerId, adminToken, visitorToken });
});

app.get('/api/rooms/:id', (req, res) => {
  const roomId = req.params.id;
  const room = rooms.get(roomId);

  if (!room) return res.status(404).json({ error: 'Room not found' });

  // In a real app, verify ownership before sending adminToken
  // For this prototype, we send tokens to facilitate the Share Modal logic
  res.json({
    id: room.id,
    name: room.name,
    isPublic: room.isPublic,
    hasPassword: !!room.password,
    defaultRole: room.defaultRole,
    maxUsers: room.maxUsers,
    adminToken: room.adminToken,
    visitorToken: room.visitorToken
  });
});

app.post('/api/rooms/:id/join', (req, res) => {
  const roomId = req.params.id;
  const { password } = req.body;
  const room = rooms.get(roomId);

  if (!room) return res.status(404).json({ error: 'Room not found' });
  if (room.password && room.password !== password) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  // Return the default role's token if password is correct
  const token = room.defaultRole === 'editor' ? room.adminToken : room.visitorToken;
  res.json({ success: true, role: room.defaultRole, token });
});

app.delete('/api/rooms/:id', (req, res) => {
    const roomId = req.params.id;
    const { ownerId } = req.body || {};
    const room = rooms.get(roomId);
    
    if (!room) return res.status(404).json({ error: 'Room not found' });

    const headerSecret = req.headers['x-admin-secret'];
    if (headerSecret === ADMIN_SECRET || (ownerId && room.ownerId === ownerId)) {
        deleteRoom(roomId);
        return res.json({ success: true });
    }

    return res.status(403).json({ error: 'Unauthorized' });
});

// Update Room (Admin)
app.patch('/api/rooms/:id', (req, res) => {
    const roomId = req.params.id;
    const { name, isPublic, password, maxUsers, extendTime } = req.body;
    const headerSecret = req.headers['x-admin-secret'];

    // Simple Admin Auth check
    if (headerSecret !== ADMIN_SECRET) {
        return res.status(403).json({ error: 'Unauthorized' });
    }

    const room = rooms.get(roomId);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    // Update Fields
    if (name) room.name = name;
    if (isPublic !== undefined) room.isPublic = isPublic;
    if (password !== undefined) room.password = password || null; // Empty string clears it
    if (maxUsers !== undefined) room.maxUsers = parseInt(maxUsers) || Infinity;

    // Handle Time Extension
    if (extendTime) {
        // Clear existing timer
        const oldTimer = expirationTimers.get(roomId);
        if (oldTimer) clearTimeout(oldTimer);

        // Calculate new expiry
        // If expired, start from now. If active, add to current expiry.
        const baseTime = (room.expiry && room.expiry > Date.now()) ? room.expiry : Date.now();
        const newExpiry = baseTime + (extendTime * 60 * 1000);
        
        room.expiry = newExpiry;

        const newTimer = setTimeout(() => deleteRoom(roomId), newExpiry - Date.now());
        expirationTimers.set(roomId, newTimer);
    } else if (extendTime === 0) {
        // Remove limit (set to forever)
        const oldTimer = expirationTimers.get(roomId);
        if (oldTimer) {
            clearTimeout(oldTimer);
            expirationTimers.delete(roomId);
        }
        room.expiry = null;
    }

    rooms.set(roomId, room);
    console.log(`Room updated: ${roomId}`);
    res.json({ success: true, room: { ...room, password: !!room.password } });
});


// --- Server Setup with Security ---

const server = http.createServer(app);
const wss = new WebSocket.Server({ noServer: true });

server.on('upgrade', (request, socket, head) => {
  // Parse URL: /?token=XYZ
  // y-websocket usually connects to ws://host/roomname
  // Request url is something like: /room-id
  
  const urlParts = request.url.split('?');
  const docName = urlParts[0].slice(1); // remove leading slash
  const params = new URLSearchParams(urlParts[1]);
  const token = params.get('token');

  const room = rooms.get(docName);

  // If room doesn't exist in our manager, it might be an ad-hoc yjs room.
  // But we want to enforce our rooms.
  if (!room) {
      // Option: Allow ad-hoc or Reject.
      // We Reject to enforce Lobby creation flow.
      socket.write('HTTP/1.1 404 Room Not Found\r\n\r\n');
      socket.destroy();
      return;
  }

  // Determine Permissions
  let permission = 'none';

  if (token === room.adminToken) {
      permission = 'write';
  } else if (token === room.visitorToken) {
      permission = 'read';
  } else if (room.isPublic) {
      permission = room.defaultRole === 'editor' ? 'write' : 'read';
  } else {
      // Private room, invalid/missing token
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
  }
  
  // Attach permission to the socket data
  // Note: 'ws' instance is created by wss.handleUpgrade, but here we only have the raw socket.
  // We can pass data via the request object which setupWSConnection uses? 
  // No, setupWSConnection takes the websocket instance.
  
  wss.handleUpgrade(request, socket, head, (ws) => {
      ws.data = { permission };
      
      // Basic Read-Only Enforcement
      // If permission is 'read', we want to block updates.
      // y-websocket uses 'message' event. We can intercept it.
      if (permission === 'read') {
          const originalOn = ws.on.bind(ws);
          ws.on = (event, listener) => {
              if (event === 'message') {
                  const wrappedListener = (data, isBinary) => {
                      // Yjs Protocol:
                      // SyncStep1 = 0, SyncStep2 = 1, Update = 2.
                      // If data[0] === 0 (Sync), we check data[1].
                      // If data[1] === 2 (Update), we block.
                      
                      if (data && data.length > 0) {
                          if (data[0] === 0 && data[1] === 2) {
                              // console.log('Blocked write attempt from read-only user');
                              return; // Drop message
                          }
                      }
                      return listener(data, isBinary);
                  };
                  return originalOn(event, wrappedListener);
              }
              return originalOn(event, listener);
          };
      }

      setupWSConnection(ws, request);
  });
});

server.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
