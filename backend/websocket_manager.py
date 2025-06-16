from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import asyncio
import logging
from datetime import datetime
import uuid

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Active WebSocket connections
        self.active_connections: Dict[str, WebSocket] = {}
        # User ID to connection ID mapping
        self.user_connections: Dict[str, str] = {}
        # Court subscriptions (court_id -> set of connection_ids)
        self.court_subscriptions: Dict[str, Set[str]] = {}
        # Game subscriptions (game_id -> set of connection_ids)
        self.game_subscriptions: Dict[str, Set[str]] = {}
        # Tournament subscriptions (tournament_id -> set of connection_ids)
        self.tournament_subscriptions: Dict[str, Set[str]] = {}
        # General subscriptions (all users)
        self.general_subscriptions: Set[str] = set()

    async def connect(self, websocket: WebSocket, user_id: str) -> str:
        """Accept a WebSocket connection and register user"""
        await websocket.accept()
        connection_id = str(uuid.uuid4())
        
        self.active_connections[connection_id] = websocket
        self.user_connections[user_id] = connection_id
        self.general_subscriptions.add(connection_id)
        
        logger.info(f"User {user_id} connected with connection {connection_id}")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "message": "Connected to M2DG Basketball real-time system",
            "connection_id": connection_id,
            "timestamp": datetime.utcnow().isoformat()
        }, connection_id)
        
        # Broadcast user connected event
        await self.broadcast_general({
            "type": "user_connected",
            "user_id": user_id,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        return connection_id

    async def disconnect(self, connection_id: str):
        """Remove connection and clean up subscriptions"""
        if connection_id in self.active_connections:
            # Find user ID
            user_id = None
            for uid, conn_id in self.user_connections.items():
                if conn_id == connection_id:
                    user_id = uid
                    break
            
            # Remove from all subscriptions
            self.general_subscriptions.discard(connection_id)
            
            for court_subs in self.court_subscriptions.values():
                court_subs.discard(connection_id)
            
            for game_subs in self.game_subscriptions.values():
                game_subs.discard(connection_id)
            
            for tournament_subs in self.tournament_subscriptions.values():
                tournament_subs.discard(connection_id)
            
            # Remove connection
            del self.active_connections[connection_id]
            if user_id:
                self.user_connections.pop(user_id, None)
                
                # Broadcast user disconnected event
                await self.broadcast_general({
                    "type": "user_disconnected",
                    "user_id": user_id,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            logger.info(f"Connection {connection_id} (user: {user_id}) disconnected")

    async def send_personal_message(self, message: dict, connection_id: str):
        """Send a message to a specific connection"""
        if connection_id in self.active_connections:
            try:
                websocket = self.active_connections[connection_id]
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error sending message to {connection_id}: {e}")
                await self.disconnect(connection_id)

    async def send_to_user(self, message: dict, user_id: str):
        """Send a message to a specific user"""
        connection_id = self.user_connections.get(user_id)
        if connection_id:
            await self.send_personal_message(message, connection_id)

    async def broadcast_general(self, message: dict):
        """Broadcast message to all connected users"""
        message["timestamp"] = datetime.utcnow().isoformat()
        disconnected_connections = []
        
        for connection_id in list(self.general_subscriptions):
            try:
                if connection_id in self.active_connections:
                    websocket = self.active_connections[connection_id]
                    await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"Error broadcasting to {connection_id}: {e}")
                disconnected_connections.append(connection_id)
        
        # Clean up disconnected connections
        for connection_id in disconnected_connections:
            await self.disconnect(connection_id)

    async def subscribe_to_court(self, connection_id: str, court_id: str):
        """Subscribe connection to court updates"""
        if court_id not in self.court_subscriptions:
            self.court_subscriptions[court_id] = set()
        self.court_subscriptions[court_id].add(connection_id)
        
        await self.send_personal_message({
            "type": "subscription_confirmed",
            "subscription_type": "court",
            "court_id": court_id,
            "timestamp": datetime.utcnow().isoformat()
        }, connection_id)

    async def unsubscribe_from_court(self, connection_id: str, court_id: str):
        """Unsubscribe connection from court updates"""
        if court_id in self.court_subscriptions:
            self.court_subscriptions[court_id].discard(connection_id)
            if not self.court_subscriptions[court_id]:
                del self.court_subscriptions[court_id]

    async def broadcast_to_court(self, message: dict, court_id: str):
        """Broadcast message to all court subscribers"""
        if court_id in self.court_subscriptions:
            message["timestamp"] = datetime.utcnow().isoformat()
            disconnected_connections = []
            
            for connection_id in list(self.court_subscriptions[court_id]):
                try:
                    if connection_id in self.active_connections:
                        websocket = self.active_connections[connection_id]
                        await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting court update to {connection_id}: {e}")
                    disconnected_connections.append(connection_id)
            
            # Clean up disconnected connections
            for connection_id in disconnected_connections:
                self.court_subscriptions[court_id].discard(connection_id)

    async def subscribe_to_game(self, connection_id: str, game_id: str):
        """Subscribe connection to game updates"""
        if game_id not in self.game_subscriptions:
            self.game_subscriptions[game_id] = set()
        self.game_subscriptions[game_id].add(connection_id)
        
        await self.send_personal_message({
            "type": "subscription_confirmed",
            "subscription_type": "game",
            "game_id": game_id,
            "timestamp": datetime.utcnow().isoformat()
        }, connection_id)

    async def broadcast_to_game(self, message: dict, game_id: str):
        """Broadcast message to all game subscribers"""
        if game_id in self.game_subscriptions:
            message["timestamp"] = datetime.utcnow().isoformat()
            disconnected_connections = []
            
            for connection_id in list(self.game_subscriptions[game_id]):
                try:
                    if connection_id in self.active_connections:
                        websocket = self.active_connections[connection_id]
                        await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting game update to {connection_id}: {e}")
                    disconnected_connections.append(connection_id)
            
            # Clean up disconnected connections
            for connection_id in disconnected_connections:
                self.game_subscriptions[game_id].discard(connection_id)

    async def subscribe_to_tournament(self, connection_id: str, tournament_id: str):
        """Subscribe connection to tournament updates"""
        if tournament_id not in self.tournament_subscriptions:
            self.tournament_subscriptions[tournament_id] = set()
        self.tournament_subscriptions[tournament_id].add(connection_id)
        
        await self.send_personal_message({
            "type": "subscription_confirmed",
            "subscription_type": "tournament",
            "tournament_id": tournament_id,
            "timestamp": datetime.utcnow().isoformat()
        }, connection_id)

    async def broadcast_to_tournament(self, message: dict, tournament_id: str):
        """Broadcast message to all tournament subscribers"""
        if tournament_id in self.tournament_subscriptions:
            message["timestamp"] = datetime.utcnow().isoformat()
            disconnected_connections = []
            
            for connection_id in list(self.tournament_subscriptions[tournament_id]):
                try:
                    if connection_id in self.active_connections:
                        websocket = self.active_connections[connection_id]
                        await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error broadcasting tournament update to {connection_id}: {e}")
                    disconnected_connections.append(connection_id)
            
            # Clean up disconnected connections
            for connection_id in disconnected_connections:
                self.tournament_subscriptions[tournament_id].discard(connection_id)

    def get_connection_stats(self) -> dict:
        """Get connection statistics"""
        return {
            "total_connections": len(self.active_connections),
            "court_subscriptions": {court_id: len(subs) for court_id, subs in self.court_subscriptions.items()},
            "game_subscriptions": {game_id: len(subs) for game_id, subs in self.game_subscriptions.items()},
            "tournament_subscriptions": {tournament_id: len(subs) for tournament_id, subs in self.tournament_subscriptions.items()},
            "general_subscriptions": len(self.general_subscriptions)
        }

# Global connection manager instance
manager = ConnectionManager()