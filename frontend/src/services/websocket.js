class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnecting = false;
    this.userId = null;
  }

  connect(userId) {
    if (this.isConnecting || (this.socket && this.socket.readyState === WebSocket.OPEN)) {
      return;
    }

    this.isConnecting = true;
    this.userId = userId;
    
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const wsUrl = backendUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    
    try {
      this.socket = new WebSocket(`${wsUrl}/ws/${userId}`);
      
      this.socket.onopen = (event) => {
        console.log('🏀 WebSocket connected to M2DG Basketball');
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        this.emit('connected', { event });
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          this.emit(data.type, data);
          this.emit('message', data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('❌ WebSocket disconnected:', event.code, event.reason);
        this.isConnecting = false;
        this.socket = null;
        this.emit('disconnected', { event });
        
        // Attempt to reconnect
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          setTimeout(() => {
            this.connect(this.userId);
          }, this.reconnectDelay * this.reconnectAttempts);
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.isConnecting = false;
        this.emit('error', { error });
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.isConnecting = false;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.isConnecting = false;
    this.userId = null;
    this.reconnectAttempts = 0;
  }

  send(message) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket is not connected. Message not sent:', message);
      return false;
    }
  }

  // Event listener management
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in WebSocket event listener for ${event}:`, error);
        }
      });
    }
  }

  // Convenience methods for basketball-specific subscriptions
  subscribeToCourt(courtId) {
    return this.send({
      type: 'subscribe_court',
      court_id: courtId,
    });
  }

  unsubscribeFromCourt(courtId) {
    return this.send({
      type: 'unsubscribe_court',
      court_id: courtId,
    });
  }

  subscribeToGame(gameId) {
    return this.send({
      type: 'subscribe_game',
      game_id: gameId,
    });
  }

  subscribeToTournament(tournamentId) {
    return this.send({
      type: 'subscribe_tournament',
      tournament_id: tournamentId,
    });
  }

  ping() {
    return this.send({
      type: 'ping',
      timestamp: new Date().toISOString(),
    });
  }

  getConnectionState() {
    if (!this.socket) return 'disconnected';
    
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      case WebSocket.CLOSING:
        return 'closing';
      case WebSocket.CLOSED:
        return 'disconnected';
      default:
        return 'unknown';
    }
  }

  isConnected() {
    return this.socket && this.socket.readyState === WebSocket.OPEN;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;