from fastapi import FastAPI, APIRouter, HTTPException, Depends, status, WebSocket, WebSocketDisconnect
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
from datetime import datetime, timedelta
import jwt
from passlib.context import CryptContext
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from enum import Enum
import json

# Import Phase 2 models and WebSocket manager
from models_extended import *
from websocket_manager import manager

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "basketball_m2dg_secret_key_2025"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Create the main app
app = FastAPI(title="M2DG Basketball Community API", version="2.0.0")
api_router = APIRouter(prefix="/api")

# Enums
class UserRole(str, Enum):
    PLAYER = "player"
    COACH = "coach"
    ADMIN = "admin"

class ChallengeStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class GameStatus(str, Enum):
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class SkillLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    PROFESSIONAL = "professional"

# Data Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    email: EmailStr
    password_hash: str
    full_name: str
    role: UserRole = UserRole.PLAYER
    skill_level: SkillLevel = SkillLevel.BEGINNER
    avatar_url: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    height: Optional[float] = None  # in cm
    weight: Optional[float] = None  # in kg
    position: Optional[str] = None
    years_playing: Optional[int] = None
    bio: Optional[str] = None
    location: Optional[str] = None
    total_games: int = 0
    wins: int = 0
    losses: int = 0
    points_scored: int = 0
    rating: float = 1200.0  # ELO-style rating
    wallet_balance: float = 0.0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    full_name: str
    role: UserRole = UserRole.PLAYER
    skill_level: SkillLevel = SkillLevel.BEGINNER

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Court(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    location: str
    address: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    amenities: List[str] = []
    hourly_rate: float = 0.0
    rating: float = 0.0
    total_ratings: int = 0
    surface_type: str = "outdoor"  # outdoor, indoor
    lighting: bool = False
    covered: bool = False
    max_players: int = 10
    current_players: List[str] = []  # List of user IDs currently at court
    images: List[str] = []
    operating_hours: Dict[str, str] = {}
    contact_info: Optional[str] = None
    booking_required: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class Challenge(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    challenger_id: str
    challenged_id: Optional[str] = None
    court_id: str
    title: str
    description: str
    skill_level_required: SkillLevel
    stakes: float = 0.0  # Money at stake
    game_type: str = "1v1"  # 1v1, 2v2, 3v3, 5v5
    scheduled_time: datetime
    status: ChallengeStatus = ChallengeStatus.PENDING
    winner_id: Optional[str] = None
    final_score: Optional[Dict[str, int]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    max_participants: int = 2

class Coach(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str  # Reference to User
    specialties: List[str] = []
    experience_years: int
    hourly_rate: float
    rating: float = 0.0
    total_ratings: int = 0
    certifications: List[str] = []
    bio: str
    availability: Dict[str, List[str]] = {}  # Day -> available hours
    total_sessions: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class Game(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    court_id: str
    players: List[str]  # User IDs
    game_type: str = "casual"  # casual, challenge, tournament
    scheduled_time: datetime
    actual_start_time: Optional[datetime] = None
    actual_end_time: Optional[datetime] = None
    status: GameStatus = GameStatus.SCHEDULED
    score: Dict[str, int] = {}
    winner_ids: List[str] = []
    referee_id: Optional[str] = None
    spectators: List[str] = []
    live_viewers: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class Product(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    price: float
    category: str
    brand: Optional[str] = None
    images: List[str] = []
    sizes: List[str] = []
    colors: List[str] = []
    stock_quantity: int = 0
    rating: float = 0.0
    total_ratings: int = 0
    features: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class PlayerStats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    game_id: str
    points: int = 0
    rebounds: int = 0
    assists: int = 0
    steals: int = 0
    blocks: int = 0
    turnovers: int = 0
    field_goals_made: int = 0
    field_goals_attempted: int = 0
    three_pointers_made: int = 0
    three_pointers_attempted: int = 0
    free_throws_made: int = 0
    free_throws_attempted: int = 0
    fouls: int = 0
    minutes_played: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Response Models
class Token(BaseModel):
    access_token: str
    token_type: str
    user: Dict[str, Any]

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: str
    role: UserRole
    skill_level: SkillLevel
    avatar_url: Optional[str]
    rating: float
    total_games: int
    wins: int
    losses: int
    wallet_balance: float
    created_at: datetime

# Utility Functions
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    return User(**user)

# Authentication Routes
@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserCreate):
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Check if username already exists
    existing_username = await db.users.find_one({"username": user_data.username})
    if existing_username:
        raise HTTPException(status_code=400, detail="Username already taken")
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        role=user_data.role,
        skill_level=user_data.skill_level
    )
    
    # Insert into database
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user.id,
        username=user.username,
        email=user.email,
        full_name=user.full_name,
        role=user.role,
        skill_level=user.skill_level,
        avatar_url=user.avatar_url,
        rating=user.rating,
        total_games=user.total_games,
        wins=user.wins,
        losses=user.losses,
        wallet_balance=user.wallet_balance,
        created_at=user.created_at
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_response.dict()}

@api_router.post("/auth/login", response_model=Token)
async def login(user_credentials: UserLogin):
    user = await db.users.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["id"]}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(
        id=user["id"],
        username=user["username"],
        email=user["email"],
        full_name=user["full_name"],
        role=user["role"],
        skill_level=user["skill_level"],
        avatar_url=user.get("avatar_url"),
        rating=user["rating"],
        total_games=user["total_games"],
        wins=user["wins"],
        losses=user["losses"],
        wallet_balance=user["wallet_balance"],
        created_at=user["created_at"]
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": user_response.dict()}

@api_router.get("/auth/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        full_name=current_user.full_name,
        role=current_user.role,
        skill_level=current_user.skill_level,
        avatar_url=current_user.avatar_url,
        rating=current_user.rating,
        total_games=current_user.total_games,
        wins=current_user.wins,
        losses=current_user.losses,
        wallet_balance=current_user.wallet_balance,
        created_at=current_user.created_at
    )

# User Routes
@api_router.get("/users", response_model=List[UserResponse])
async def get_users(skip: int = 0, limit: int = 100):
    users = await db.users.find().skip(skip).limit(limit).to_list(limit)
    return [UserResponse(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse(**user)

# Court Routes
@api_router.get("/courts", response_model=List[Court])
async def get_courts(skip: int = 0, limit: int = 100):
    courts = await db.courts.find({"is_active": True}).skip(skip).limit(limit).to_list(limit)
    return [Court(**court) for court in courts]

@api_router.get("/courts/{court_id}", response_model=Court)
async def get_court(court_id: str):
    court = await db.courts.find_one({"id": court_id, "is_active": True})
    if not court:
        raise HTTPException(status_code=404, detail="Court not found")
    return Court(**court)

@api_router.post("/courts", response_model=Court)
async def create_court(court_data: Court, current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Only admins can create courts")
    
    await db.courts.insert_one(court_data.dict())
    return court_data

# Challenge Routes
@api_router.get("/challenges", response_model=List[Challenge])
async def get_challenges(skip: int = 0, limit: int = 100, status: Optional[ChallengeStatus] = None):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    
    challenges = await db.challenges.find(filter_dict).skip(skip).limit(limit).to_list(limit)
    return [Challenge(**challenge) for challenge in challenges]

@api_router.post("/challenges", response_model=Challenge)
async def create_challenge(challenge_data: Challenge, current_user: User = Depends(get_current_user)):
    challenge_data.challenger_id = current_user.id
    await db.challenges.insert_one(challenge_data.dict())
    return challenge_data

@api_router.get("/challenges/{challenge_id}", response_model=Challenge)
async def get_challenge(challenge_id: str):
    challenge = await db.challenges.find_one({"id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    return Challenge(**challenge)

@api_router.put("/challenges/{challenge_id}/accept")
async def accept_challenge(challenge_id: str, current_user: User = Depends(get_current_user)):
    challenge = await db.challenges.find_one({"id": challenge_id})
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    if challenge["status"] != ChallengeStatus.PENDING:
        raise HTTPException(status_code=400, detail="Challenge is not available for acceptance")
    
    await db.challenges.update_one(
        {"id": challenge_id},
        {"$set": {"challenged_id": current_user.id, "status": ChallengeStatus.ACCEPTED, "updated_at": datetime.utcnow()}}
    )
    
    return {"message": "Challenge accepted successfully"}

# Coach Routes
@api_router.get("/coaches", response_model=List[Coach])
async def get_coaches(skip: int = 0, limit: int = 100):
    coaches = await db.coaches.find({"is_active": True}).skip(skip).limit(limit).to_list(limit)
    return [Coach(**coach) for coach in coaches]

@api_router.get("/coaches/{coach_id}", response_model=Coach)
async def get_coach(coach_id: str):
    coach = await db.coaches.find_one({"id": coach_id, "is_active": True})
    if not coach:
        raise HTTPException(status_code=404, detail="Coach not found")
    return Coach(**coach)

# Game Routes
@api_router.get("/games", response_model=List[Game])
async def get_games(skip: int = 0, limit: int = 100, status: Optional[GameStatus] = None):
    filter_dict = {}
    if status:
        filter_dict["status"] = status
    
    games = await db.games.find(filter_dict).skip(skip).limit(limit).to_list(limit)
    return [Game(**game) for game in games]

@api_router.post("/games", response_model=Game)
async def create_game(game_data: Game, current_user: User = Depends(get_current_user)):
    await db.games.insert_one(game_data.dict())
    return game_data

# Product Routes
@api_router.get("/products", response_model=List[Product])
async def get_products(skip: int = 0, limit: int = 100, category: Optional[str] = None):
    filter_dict = {"is_active": True}
    if category:
        filter_dict["category"] = category
    
    products = await db.products.find(filter_dict).skip(skip).limit(limit).to_list(limit)
    return [Product(**product) for product in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id, "is_active": True})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

# Player Stats Routes
@api_router.get("/stats/user/{user_id}", response_model=List[PlayerStats])
async def get_user_stats(user_id: str):
    stats = await db.player_stats.find({"user_id": user_id}).to_list(1000)
    return [PlayerStats(**stat) for stat in stats]

@api_router.post("/stats", response_model=PlayerStats)
async def create_player_stats(stats_data: PlayerStats, current_user: User = Depends(get_current_user)):
    await db.player_stats.insert_one(stats_data.dict())
    return stats_data

# Health Check
@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow(), "service": "M2DG Basketball API"}

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)