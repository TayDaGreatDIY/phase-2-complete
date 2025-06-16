import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timedelta
import uuid
from passlib.context import CryptContext

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

async def populate_sample_data():
    print("🏀 Populating M2DG Basketball App with sample data...")
    
    # Clear existing data
    await db.users.delete_many({})
    await db.courts.delete_many({})
    await db.challenges.delete_many({})
    await db.coaches.delete_many({})
    await db.games.delete_many({})
    await db.products.delete_many({})
    await db.player_stats.delete_many({})
    
    print("✅ Cleared existing data")
    
    # Sample Users
    users = [
        {
            "id": str(uuid.uuid4()),
            "username": "mike_jordan",
            "email": "mike@m2dg.com",
            "password_hash": get_password_hash("password123"),
            "full_name": "Mike Jordan",
            "role": "player",
            "skill_level": "professional",
            "avatar_url": "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400",
            "phone": "+1234567890",
            "height": 198.0,
            "weight": 98.0,
            "position": "Shooting Guard",
            "years_playing": 15,
            "bio": "Professional basketball player with championship experience.",
            "location": "Chicago, IL",
            "total_games": 45,
            "wins": 38,
            "losses": 7,
            "points_scored": 1250,
            "rating": 1850.0,
            "wallet_balance": 150.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "username": "sarah_hoops",
            "email": "sarah@m2dg.com",
            "password_hash": get_password_hash("password123"),
            "full_name": "Sarah Thompson",
            "role": "player",
            "skill_level": "advanced",
            "avatar_url": "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=400",
            "phone": "+1234567891",
            "height": 175.0,
            "weight": 68.0,
            "position": "Point Guard",
            "years_playing": 8,
            "bio": "Competitive player looking for challenging games.",
            "location": "Los Angeles, CA",
            "total_games": 32,
            "wins": 24,
            "losses": 8,
            "points_scored": 890,
            "rating": 1650.0,
            "wallet_balance": 75.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "username": "coach_smith",
            "email": "coach@m2dg.com",
            "password_hash": get_password_hash("password123"),
            "full_name": "Coach David Smith",
            "role": "coach",
            "skill_level": "professional",
            "avatar_url": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "phone": "+1234567892",
            "years_playing": 20,
            "bio": "Professional basketball coach with 10+ years experience.",
            "location": "New York, NY",
            "total_games": 120,
            "wins": 95,
            "losses": 25,
            "points_scored": 2450,
            "rating": 1900.0,
            "wallet_balance": 300.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "username": "rookie_alex",
            "email": "alex@m2dg.com",
            "password_hash": get_password_hash("password123"),
            "full_name": "Alex Rivera",
            "role": "player",
            "skill_level": "beginner",
            "avatar_url": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400",
            "phone": "+1234567893",
            "height": 180.0,
            "weight": 75.0,
            "position": "Forward",
            "years_playing": 2,
            "bio": "New to basketball, eager to learn and improve.",
            "location": "Miami, FL",
            "total_games": 8,
            "wins": 3,
            "losses": 5,
            "points_scored": 120,
            "rating": 1100.0,
            "wallet_balance": 25.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "username": "admin_user",
            "email": "admin@m2dg.com",
            "password_hash": get_password_hash("admin123"),
            "full_name": "Admin User",
            "role": "admin",
            "skill_level": "intermediate",
            "avatar_url": "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400",
            "phone": "+1234567894",
            "bio": "Platform administrator",
            "location": "San Francisco, CA",
            "total_games": 0,
            "wins": 0,
            "losses": 0,
            "points_scored": 0,
            "rating": 1200.0,
            "wallet_balance": 0.0,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.users.insert_many(users)
    print("✅ Created 5 sample users")
    
    # Sample Courts
    courts = [
        {
            "id": str(uuid.uuid4()),
            "name": "Downtown Basketball Arena",
            "description": "Professional indoor basketball court with premium facilities.",
            "location": "Downtown District",
            "address": "123 Basketball Ave, Downtown",
            "latitude": 40.7589,
            "longitude": -73.9851,
            "amenities": ["Locker Rooms", "Parking", "Lighting", "Air Conditioning", "Scoreboard"],
            "hourly_rate": 25.0,
            "rating": 4.8,
            "total_ratings": 125,
            "surface_type": "indoor",
            "lighting": True,
            "covered": True,
            "max_players": 10,
            "current_players": [],
            "images": [
                "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
                "https://images.unsplash.com/photo-1574952897370-2c20d86b2b57?w=800"
            ],
            "operating_hours": {
                "monday": "6:00 AM - 10:00 PM",
                "tuesday": "6:00 AM - 10:00 PM",
                "wednesday": "6:00 AM - 10:00 PM",
                "thursday": "6:00 AM - 10:00 PM",
                "friday": "6:00 AM - 11:00 PM",
                "saturday": "7:00 AM - 11:00 PM",
                "sunday": "8:00 AM - 9:00 PM"
            },
            "contact_info": "(555) 123-4567",
            "booking_required": True,
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Riverside Park Court",
            "description": "Outdoor court with great city views, perfect for pickup games.",
            "location": "Riverside Park",
            "address": "456 River Rd, Riverside",
            "latitude": 40.7614,
            "longitude": -73.9776,
            "amenities": ["Parking", "Water Fountain", "Benches", "Lighting"],
            "hourly_rate": 0.0,
            "rating": 4.2,
            "total_ratings": 89,
            "surface_type": "outdoor",
            "lighting": True,
            "covered": False,
            "max_players": 10,
            "current_players": [],
            "images": [
                "https://images.unsplash.com/photo-1594736797933-d0c90fe6e9d4?w=800",
                "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800"
            ],
            "operating_hours": {
                "monday": "24 hours",
                "tuesday": "24 hours",
                "wednesday": "24 hours",
                "thursday": "24 hours",
                "friday": "24 hours",
                "saturday": "24 hours",
                "sunday": "24 hours"
            },
            "contact_info": "City Parks Department",
            "booking_required": False,
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Elite Training Center",
            "description": "High-end training facility with professional equipment and coaching.",
            "location": "Sports Complex",
            "address": "789 Elite Way, Sports District",
            "latitude": 40.7505,
            "longitude": -73.9934,
            "amenities": ["Locker Rooms", "Showers", "Parking", "Valet", "Pro Shop", "Cafe", "Recovery Room"],
            "hourly_rate": 50.0,
            "rating": 4.9,
            "total_ratings": 67,
            "surface_type": "indoor",
            "lighting": True,
            "covered": True,
            "max_players": 12,
            "current_players": [],
            "images": [
                "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
                "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800"
            ],
            "operating_hours": {
                "monday": "5:00 AM - 11:00 PM",
                "tuesday": "5:00 AM - 11:00 PM",
                "wednesday": "5:00 AM - 11:00 PM",
                "thursday": "5:00 AM - 11:00 PM",
                "friday": "5:00 AM - 12:00 AM",
                "saturday": "6:00 AM - 12:00 AM",
                "sunday": "7:00 AM - 10:00 PM"
            },
            "contact_info": "(555) 987-6543",
            "booking_required": True,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.courts.insert_many(courts)
    print("✅ Created 3 sample courts")
    
    # Sample Coaches
    coaches = [
        {
            "id": str(uuid.uuid4()),
            "user_id": users[2]["id"],  # Coach Smith
            "specialties": ["Shooting", "Ball Handling", "Defense", "Game Strategy"],
            "experience_years": 12,
            "hourly_rate": 75.0,
            "rating": 4.9,
            "total_ratings": 47,
            "certifications": ["USA Basketball Certified", "Level 3 Coaching License"],
            "bio": "Former professional player with extensive coaching experience. Specializes in developing fundamental skills and game IQ.",
            "availability": {
                "monday": ["9:00 AM", "2:00 PM", "6:00 PM"],
                "tuesday": ["10:00 AM", "3:00 PM", "7:00 PM"],
                "wednesday": ["9:00 AM", "2:00 PM", "6:00 PM"],
                "thursday": ["10:00 AM", "3:00 PM", "7:00 PM"],
                "friday": ["9:00 AM", "2:00 PM"],
                "saturday": ["8:00 AM", "1:00 PM", "5:00 PM"],
                "sunday": ["10:00 AM", "3:00 PM"]
            },
            "total_sessions": 234,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.coaches.insert_many(coaches)
    print("✅ Created 1 sample coach")
    
    # Sample Products
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": "Nike Air Jordan Basketball Shoes",
            "description": "Premium basketball shoes with excellent grip and ankle support.",
            "price": 179.99,
            "category": "footwear",
            "brand": "Nike",
            "images": [
                "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800",
                "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800"
            ],
            "sizes": ["8", "8.5", "9", "9.5", "10", "10.5", "11", "11.5", "12"],
            "colors": ["Black", "White", "Red", "Blue"],
            "stock_quantity": 50,
            "rating": 4.6,
            "total_ratings": 234,
            "features": ["Air Cushioning", "High-top Design", "Durable Rubber Sole", "Breathable Upper"],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Wilson Evolution Basketball",
            "description": "Official size composite leather basketball, perfect for indoor games.",
            "price": 59.99,
            "category": "equipment",
            "brand": "Wilson",
            "images": [
                "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
                "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800"
            ],
            "sizes": ["Official (29.5\")"],
            "colors": ["Orange/Black"],
            "stock_quantity": 75,
            "rating": 4.8,
            "total_ratings": 156,
            "features": ["Composite Leather", "Deep Channel Design", "Cushion Core Technology", "Official Size"],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Dri-FIT Basketball Jersey",
            "description": "Moisture-wicking basketball jersey for optimal performance.",
            "price": 39.99,
            "category": "apparel",
            "brand": "Nike",
            "images": [
                "https://images.unsplash.com/photo-1571945153237-4929e783af4a?w=800"
            ],
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Red", "Blue", "Black", "White", "Orange"],
            "stock_quantity": 100,
            "rating": 4.4,
            "total_ratings": 89,
            "features": ["Dri-FIT Technology", "Lightweight", "Breathable Mesh", "Athletic Fit"],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Basketball Training Shorts",
            "description": "High-performance shorts designed for basketball training and games.",
            "price": 29.99,
            "category": "apparel",
            "brand": "Under Armour",
            "images": [
                "https://images.unsplash.com/photo-1594736797933-d0c90fe6e9d4?w=800"
            ],
            "sizes": ["S", "M", "L", "XL", "XXL"],
            "colors": ["Black", "Navy", "Gray", "Red"],
            "stock_quantity": 80,
            "rating": 4.3,
            "total_ratings": 67,
            "features": ["HeatGear Technology", "4-Way Stretch", "Moisture Transport", "Anti-Odor"],
            "created_at": datetime.utcnow(),
            "is_active": True
        },
        {
            "id": str(uuid.uuid4()),
            "name": "Premium Basketball Backpack",
            "description": "Spacious backpack with ball compartment and shoe storage.",
            "price": 89.99,
            "category": "accessories",
            "brand": "Spalding",
            "images": [
                "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800"
            ],
            "sizes": ["One Size"],
            "colors": ["Black", "Navy", "Red"],
            "stock_quantity": 30,
            "rating": 4.5,
            "total_ratings": 43,
            "features": ["Ball Compartment", "Shoe Storage", "Laptop Sleeve", "Water Bottle Holder"],
            "created_at": datetime.utcnow(),
            "is_active": True
        }
    ]
    
    await db.products.insert_many(products)
    print("✅ Created 5 sample products")
    
    # Sample Challenges
    challenges = [
        {
            "id": str(uuid.uuid4()),
            "challenger_id": users[0]["id"],  # Mike Jordan
            "challenged_id": None,
            "court_id": courts[0]["id"],
            "title": "1v1 Championship Challenge",
            "description": "Looking for an advanced player for a competitive 1v1 match. Stakes included!",
            "skill_level_required": "advanced",
            "stakes": 50.0,
            "game_type": "1v1",
            "scheduled_time": datetime.utcnow() + timedelta(days=2, hours=3),
            "status": "pending",
            "winner_id": None,
            "final_score": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "max_participants": 2
        },
        {
            "id": str(uuid.uuid4()),
            "challenger_id": users[1]["id"],  # Sarah Thompson
            "challenged_id": None,
            "court_id": courts[1]["id"],
            "title": "Friendly Pickup Game",
            "description": "Casual game for intermediate players. Let's have some fun!",
            "skill_level_required": "intermediate",
            "stakes": 0.0,
            "game_type": "2v2",
            "scheduled_time": datetime.utcnow() + timedelta(days=1, hours=5),
            "status": "pending",
            "winner_id": None,
            "final_score": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "max_participants": 4
        },
        {
            "id": str(uuid.uuid4()),
            "challenger_id": users[3]["id"],  # Alex Rivera
            "challenged_id": None,
            "court_id": courts[1]["id"],
            "title": "Beginner Practice Session",
            "description": "New players welcome! Let's practice together and improve our skills.",
            "skill_level_required": "beginner",
            "stakes": 0.0,
            "game_type": "3v3",
            "scheduled_time": datetime.utcnow() + timedelta(days=3, hours=2),
            "status": "pending",
            "winner_id": None,
            "final_score": None,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "max_participants": 6
        }
    ]
    
    await db.challenges.insert_many(challenges)
    print("✅ Created 3 sample challenges")
    
    # Sample Games
    games = [
        {
            "id": str(uuid.uuid4()),
            "court_id": courts[0]["id"],
            "players": [users[0]["id"], users[1]["id"]],
            "game_type": "challenge",
            "scheduled_time": datetime.utcnow() - timedelta(days=1),
            "actual_start_time": datetime.utcnow() - timedelta(days=1, minutes=30),
            "actual_end_time": datetime.utcnow() - timedelta(days=1, minutes=5),
            "status": "completed",
            "score": {"mike_jordan": 21, "sarah_hoops": 18},
            "winner_ids": [users[0]["id"]],
            "referee_id": None,
            "spectators": [users[2]["id"]],
            "live_viewers": 0,
            "created_at": datetime.utcnow() - timedelta(days=1, hours=2),
            "updated_at": datetime.utcnow() - timedelta(days=1, minutes=5)
        }
    ]
    
    await db.games.insert_many(games)
    print("✅ Created 1 sample game")
    
    # Sample Player Stats
    player_stats = [
        {
            "id": str(uuid.uuid4()),
            "user_id": users[0]["id"],  # Mike Jordan
            "game_id": games[0]["id"],
            "points": 21,
            "rebounds": 8,
            "assists": 3,
            "steals": 2,
            "blocks": 1,
            "turnovers": 3,
            "field_goals_made": 8,
            "field_goals_attempted": 12,
            "three_pointers_made": 2,
            "three_pointers_attempted": 4,
            "free_throws_made": 3,
            "free_throws_attempted": 3,
            "fouls": 2,
            "minutes_played": 25,
            "created_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "user_id": users[1]["id"],  # Sarah Thompson
            "game_id": games[0]["id"],
            "points": 18,
            "rebounds": 5,
            "assists": 6,
            "steals": 3,
            "blocks": 0,
            "turnovers": 4,
            "field_goals_made": 7,
            "field_goals_attempted": 11,
            "three_pointers_made": 1,
            "three_pointers_attempted": 3,
            "free_throws_made": 3,
            "free_throws_attempted": 4,
            "fouls": 3,
            "minutes_played": 25,
            "created_at": datetime.utcnow()
        }
    ]
    
    await db.player_stats.insert_many(player_stats)
    print("✅ Created 2 player stat records")
    
    print(f"\n🎉 Successfully populated M2DG Basketball App database!")
    print(f"📊 Database Summary:")
    print(f"   👥 Users: {len(users)}")
    print(f"   🏀 Courts: {len(courts)}")
    print(f"   🏆 Challenges: {len(challenges)}")
    print(f"   👨‍🏫 Coaches: {len(coaches)}")
    print(f"   🎯 Games: {len(games)}")
    print(f"   🛍️ Products: {len(products)}")
    print(f"   📈 Player Stats: {len(player_stats)}")
    
    print(f"\n🔐 Sample Login Credentials:")
    print(f"   Player: mike@m2dg.com / password123")
    print(f"   Coach: coach@m2dg.com / password123")
    print(f"   Admin: admin@m2dg.com / admin123")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_sample_data())