from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum
import uuid

# Extended Enums for Phase 2
class TournamentStatus(str, Enum):
    UPCOMING = "upcoming"
    REGISTRATION_OPEN = "registration_open"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class TournamentFormat(str, Enum):
    SINGLE_ELIMINATION = "single_elimination"
    DOUBLE_ELIMINATION = "double_elimination"
    ROUND_ROBIN = "round_robin"
    SWISS = "swiss"

class RFIDEventType(str, Enum):
    CHECK_IN = "check_in"
    CHECK_OUT = "check_out"
    ACCESS_GRANTED = "access_granted"
    ACCESS_DENIED = "access_denied"

class PresenceStatus(str, Enum):
    CHECKED_IN = "checked_in"
    CHECKED_OUT = "checked_out"
    PLAYING = "playing"
    WATCHING = "watching"

# RFID System Models
class RFIDCard(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    card_uid: str  # Unique identifier from RFID card
    user_id: str
    card_type: str = "standard"  # standard, premium, coach, admin
    is_active: bool = True
    issued_date: datetime = Field(default_factory=datetime.utcnow)
    expiry_date: Optional[datetime] = None
    access_level: int = 1  # 1=basic courts, 2=premium courts, 3=all access
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class RFIDEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    card_uid: str
    user_id: str
    court_id: str
    event_type: RFIDEventType
    success: bool = True
    error_message: Optional[str] = None
    location: Optional[str] = None
    device_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}

# Court Presence Tracking
class CourtPresence(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    court_id: str
    status: PresenceStatus = PresenceStatus.CHECKED_IN
    check_in_time: datetime = Field(default_factory=datetime.utcnow)
    check_out_time: Optional[datetime] = None
    rfid_card_uid: Optional[str] = None
    current_activity: Optional[str] = None  # "playing", "practicing", "waiting"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Tournament System Models
class Tournament(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    organizer_id: str  # User who created the tournament
    format: TournamentFormat
    status: TournamentStatus = TournamentStatus.UPCOMING
    game_type: str = "5v5"  # 1v1, 2v2, 3v3, 5v5
    max_participants: int = 16
    entry_fee: float = 0.0
    prize_pool: float = 0.0
    prize_distribution: Dict[str, float] = {}  # {"1st": 50.0, "2nd": 30.0, "3rd": 20.0}
    
    # Registration settings
    registration_start: datetime
    registration_end: datetime
    tournament_start: datetime
    tournament_end: Optional[datetime] = None
    
    # Tournament details
    court_ids: List[str] = []  # Courts assigned to tournament
    rules: List[str] = []
    requirements: Dict[str, Any] = {}  # Skill level, age, etc.
    
    # Participants and matches
    participants: List[str] = []  # User IDs
    teams: List[Dict[str, Any]] = []  # For team tournaments
    bracket: Dict[str, Any] = {}  # Tournament bracket structure
    current_round: int = 0
    
    # Settings
    allow_spectators: bool = True
    is_public: bool = True
    live_streaming: bool = False
    
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class TournamentMatch(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    tournament_id: str
    round_number: int
    match_number: int
    participant1_id: Optional[str] = None
    participant2_id: Optional[str] = None
    team1_ids: List[str] = []  # For team matches
    team2_ids: List[str] = []
    court_id: str
    scheduled_time: datetime
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    winner_id: Optional[str] = None
    winner_team_ids: List[str] = []
    score: Dict[str, int] = {}
    status: str = "scheduled"  # scheduled, in_progress, completed, cancelled
    referee_id: Optional[str] = None
    live_viewers: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Enhanced Game Models for Real-time Features
class LiveGameEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    game_id: str
    event_type: str  # "score", "foul", "timeout", "substitution", "period_end"
    player_id: Optional[str] = None
    team: Optional[str] = None
    points: Optional[int] = None
    description: str
    game_time: str  # Game clock time when event occurred
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = {}

class GameSession(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    game_id: str
    session_type: str = "live_scoring"  # live_scoring, spectating, coaching
    user_id: str
    role: str = "spectator"  # referee, player, coach, spectator
    joined_at: datetime = Field(default_factory=datetime.utcnow)
    left_at: Optional[datetime] = None
    is_active: bool = True

# Enhanced Challenge Models
class ChallengeMatchmaking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    preferred_skill_levels: List[str] = []
    preferred_game_types: List[str] = []
    max_distance: Optional[float] = None  # km from user's location
    available_times: List[Dict[str, str]] = []  # [{"day": "monday", "start": "18:00", "end": "20:00"}]
    stakes_range: Dict[str, float] = {"min": 0.0, "max": 100.0}
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Request/Response Models
class RFIDCheckInRequest(BaseModel):
    card_uid: str
    court_id: str
    device_id: Optional[str] = None

class RFIDCheckOutRequest(BaseModel):
    card_uid: str
    court_id: str
    device_id: Optional[str] = None

class TournamentCreate(BaseModel):
    name: str
    description: str
    format: TournamentFormat
    game_type: str = "5v5"
    max_participants: int = 16
    entry_fee: float = 0.0
    registration_start: datetime
    registration_end: datetime
    tournament_start: datetime
    court_ids: List[str] = []
    rules: List[str] = []
    requirements: Dict[str, Any] = {}
    allow_spectators: bool = True
    is_public: bool = True

class TournamentRegistration(BaseModel):
    tournament_id: str
    team_name: Optional[str] = None
    team_members: List[str] = []  # For team tournaments

class LiveScoreUpdate(BaseModel):
    game_id: str
    team1_score: int
    team2_score: int
    game_time: str
    period: int
    event_description: Optional[str] = None

class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=datetime.utcnow)