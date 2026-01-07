import { useEffect, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { IndexeddbPersistence } from 'y-indexeddb';

export const useWhiteboard = (roomId: string) => {
  const [doc] = useState(() => new Y.Doc());
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');

  useEffect(() => {
    // Parse token from URL
    const searchParams = new URLSearchParams(window.location.search);
    const token = searchParams.get('token');
    
    // Connect to the websocket server
    // Append token to the server URL parameters
    const serverUrl = token ? `ws://localhost:1234?token=${token}` : 'ws://localhost:1234';

    const wsProvider = new WebsocketProvider(
      serverUrl,
      roomId,
      doc
    );

    // Offline support
    new IndexeddbPersistence(roomId, doc);

    wsProvider.on('status', (event: { status: 'disconnected' | 'connecting' | 'connected' }) => {
      setStatus(event.status);
    });

    setProvider(wsProvider);

    return () => {
      wsProvider.destroy();
    };
  }, [doc, roomId]);

  return { doc, provider, status };
};
