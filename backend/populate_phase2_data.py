import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path
import os
from datetime import datetime, timedelta
import uuid
import random

# Load environment variables
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def populate_phase2_data():
    print("🚀 Populating M2DG Basketball App Phase 2 data...")
    
    # Get existing users and courts
    users = await db.users.find().to_list(100)
    courts = await db.courts.find().to_list(100)
    
    if not users or not courts:
        print("❌ Please populate Phase 1 data first!")
        return
    
    print(f"📊 Found {len(users)} users and {len(courts)} courts")
    
    # Clear Phase 2 data
    await db.rfid_cards.delete_many({})
    await db.rfid_events.delete_many({})
    await db.court_presence.delete_many({})
    await db.tournaments.delete_many({})
    await db.tournament_matches.delete_many({})
    await db.live_game_events.delete_many({})
    await db.game_sessions.delete_many({})
    await db.challenge_matchmaking.delete_many({})
    
    print("✅ Cleared existing Phase 2 data")
    
    # Create RFID Cards for users
    rfid_cards = []
    for i, user in enumerate(users):
        card = {
            "id": str(uuid.uuid4()),
            "card_uid": f"RFID_{str(uuid.uuid4())[:8].upper()}",
            "user_id": user["id"],
            "card_type": "premium" if user["role"] == "coach" else "standard",
            "is_active": True,
            "issued_date": datetime.utcnow() - timedelta(days=random.randint(1, 90)),
            "expiry_date": datetime.utcnow() + timedelta(days=365),
            "access_level": 3 if user["role"] in ["coach", "admin"] else 2,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
        rfid_cards.append(card)
    
    await db.rfid_cards.insert_many(rfid_cards)
    print(f"✅ Created {len(rfid_cards)} RFID cards")
    
    # Create sample RFID events and court presence
    rfid_events = []
    court_presence = []
    
    for i in range(20):  # 20 recent events
        user = random.choice(users)
        court = random.choice(courts)
        card = next(c for c in rfid_cards if c["user_id"] == user["id"])
        
        # Check-in event
        checkin_time = datetime.utcnow() - timedelta(hours=random.randint(1, 48))
        checkin_event = {
            "id": str(uuid.uuid4()),
            "card_uid": card["card_uid"],
            "user_id": user["id"],
            "court_id": court["id"],
            "event_type": "check_in",
            "success": True,
            "device_id": f"DEVICE_{random.randint(1, 5)}",
            "timestamp": checkin_time,
            "metadata": {"court_name": court["name"]}
        }
        rfid_events.append(checkin_event)
        
        # Determine if user is still present (70% chance of checkout)
        if random.random() < 0.7:
            # Check-out event
            checkout_time = checkin_time + timedelta(hours=random.randint(1, 4))
            checkout_event = {
                "id": str(uuid.uuid4()),
                "card_uid": card["card_uid"],
                "user_id": user["id"],
                "court_id": court["id"],
                "event_type": "check_out",
                "success": True,
                "device_id": f"DEVICE_{random.randint(1, 5)}",
                "timestamp": checkout_time,
                "metadata": {"court_name": court["name"]}
            }
            rfid_events.append(checkout_event)
            
            # Completed presence
            presence = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "court_id": court["id"],
                "status": "checked_out",
                "check_in_time": checkin_time,
                "check_out_time": checkout_time,
                "rfid_card_uid": card["card_uid"],
                "current_activity": random.choice(["playing", "practicing", "training"]),
                "created_at": checkin_time,
                "updated_at": checkout_time
            }
            court_presence.append(presence)
        else:
            # Still present
            presence = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "court_id": court["id"],
                "status": "checked_in",
                "check_in_time": checkin_time,
                "check_out_time": None,
                "rfid_card_uid": card["card_uid"],
                "current_activity": random.choice(["playing", "practicing", "waiting"]),
                "created_at": checkin_time,
                "updated_at": checkin_time
            }
            court_presence.append(presence)
            
            # Update court's current players
            await db.courts.update_one(
                {"id": court["id"]},
                {"$addToSet": {"current_players": user["id"]}}
            )
    
    await db.rfid_events.insert_many(rfid_events)
    await db.court_presence.insert_many(court_presence)
    print(f"✅ Created {len(rfid_events)} RFID events and {len(court_presence)} presence records")
    
    # Create Tournaments
    tournaments = []
    organizer_ids = [user["id"] for user in users if user["role"] in ["admin", "coach"]]
    
    tournament_templates = [
        {
            "name": "M2DG Summer Championship",
            "description": "Annual summer basketball tournament featuring the best players from our community.",
            "format": "single_elimination",
            "game_type": "5v5",
            "max_participants": 16,
            "entry_fee": 25.0,
            "prize_pool": 400.0,
            "prize_distribution": {"1st": 200.0, "2nd": 120.0, "3rd": 80.0},
            "status": "registration_open"
        },
        {
            "name": "1v1 King of the Court",
            "description": "Individual skills tournament. Who will be the king of the court?",
            "format": "single_elimination",
            "game_type": "1v1",
            "max_participants": 32,
            "entry_fee": 10.0,
            "prize_pool": 320.0,
            "prize_distribution": {"1st": 160.0, "2nd": 96.0, "3rd": 64.0},
            "status": "upcoming"
        },
        {
            "name": "Rookie League Tournament",
            "description": "Tournament for beginner and intermediate players to showcase their skills.",
            "format": "round_robin",
            "game_type": "3v3",
            "max_participants": 12,
            "entry_fee": 5.0,
            "prize_pool": 60.0,
            "prize_distribution": {"1st": 30.0, "2nd": 20.0, "3rd": 10.0},
            "status": "registration_open"
        }
    ]
    
    for i, template in enumerate(tournament_templates):
        tournament = {
            "id": str(uuid.uuid4()),
            "organizer_id": random.choice(organizer_ids),
            "registration_start": datetime.utcnow() - timedelta(days=7),
            "registration_end": datetime.utcnow() + timedelta(days=7),
            "tournament_start": datetime.utcnow() + timedelta(days=14),
            "tournament_end": datetime.utcnow() + timedelta(days=16),
            "court_ids": [court["id"] for court in random.sample(courts, 2)],
            "rules": [
                "Standard basketball rules apply",
                "Fair play is expected from all participants", 
                "Referees' decisions are final",
                "Tournament bracket will be randomly seeded"
            ],
            "requirements": {
                "min_age": 16,
                "skill_level": ["beginner", "intermediate"] if "Rookie" in template["name"] else ["intermediate", "advanced", "professional"]
            },
            "participants": [],
            "teams": [],
            "bracket": {},
            "current_round": 0,
            "allow_spectators": True,
            "is_public": True,
            "live_streaming": i == 0,  # Only championship has live streaming
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            **template
        }
        
        # Add some participants
        eligible_users = [u for u in users if u["skill_level"] in tournament["requirements"]["skill_level"]]
        participants = random.sample(eligible_users, min(len(eligible_users), random.randint(4, min(tournament["max_participants"], 12))))
        tournament["participants"] = [p["id"] for p in participants]
        
        tournaments.append(tournament)
    
    await db.tournaments.insert_many(tournaments)
    print(f"✅ Created {len(tournaments)} tournaments")
    
    # Create Tournament Matches for active tournaments
    tournament_matches = []
    for tournament in tournaments:
        if tournament["status"] in ["registration_open", "in_progress"] and len(tournament["participants"]) >= 4:
            # Create first round matches
            participants = tournament["participants"].copy()
            random.shuffle(participants)
            
            for i in range(0, len(participants) - 1, 2):
                match = {
                    "id": str(uuid.uuid4()),
                    "tournament_id": tournament["id"],
                    "round_number": 1,
                    "match_number": (i // 2) + 1,
                    "participant1_id": participants[i],
                    "participant2_id": participants[i + 1],
                    "team1_ids": [participants[i]] if tournament["game_type"] == "1v1" else [],
                    "team2_ids": [participants[i + 1]] if tournament["game_type"] == "1v1" else [],
                    "court_id": random.choice(tournament["court_ids"]),
                    "scheduled_time": tournament["tournament_start"] + timedelta(hours=i),
                    "status": "scheduled",
                    "live_viewers": 0,
                    "created_at": datetime.utcnow(),
                    "updated_at": datetime.utcnow()
                }
                
                # Some matches might be completed
                if random.random() < 0.3 and tournament["status"] == "in_progress":
                    match["status"] = "completed"
                    match["actual_start_time"] = match["scheduled_time"]
                    match["actual_end_time"] = match["scheduled_time"] + timedelta(hours=1)
                    match["winner_id"] = random.choice([participants[i], participants[i + 1]])
                    match["score"] = {
                        participants[i]: random.randint(15, 25),
                        participants[i + 1]: random.randint(10, 25)
                    }
                
                tournament_matches.append(match)
    
    if tournament_matches:
        await db.tournament_matches.insert_many(tournament_matches)
        print(f"✅ Created {len(tournament_matches)} tournament matches")
    
    # Create Live Game Events for recent games
    recent_games = await db.games.find().sort("created_at", -1).limit(5).to_list(5)
    live_events = []
    
    for game in recent_games:
        # Create some sample game events
        event_types = ["score", "foul", "timeout", "substitution"]
        for i in range(random.randint(10, 25)):
            event = {
                "id": str(uuid.uuid4()),
                "game_id": game["id"],
                "event_type": random.choice(event_types),
                "player_id": random.choice(game["players"]) if game["players"] else None,
                "team": random.choice(["team1", "team2"]),
                "points": random.randint(1, 3) if random.choice(event_types) == "score" else None,
                "description": f"Game event #{i+1}",
                "game_time": f"{random.randint(0, 48):02d}:{random.randint(0, 59):02d}",
                "timestamp": datetime.utcnow() - timedelta(minutes=random.randint(1, 1440)),
                "metadata": {"period": random.randint(1, 4)}
            }
            live_events.append(event)
    
    if live_events:
        await db.live_game_events.insert_many(live_events)
        print(f"✅ Created {len(live_events)} live game events")
    
    # Create Challenge Matchmaking Profiles
    matchmaking_profiles = []
    for user in users:
        if user["role"] == "player" and random.random() < 0.6:  # 60% of players have matchmaking profiles
            profile = {
                "id": str(uuid.uuid4()),
                "user_id": user["id"],
                "preferred_skill_levels": [user["skill_level"]],
                "preferred_game_types": random.sample(["1v1", "2v2", "3v3", "5v5"], random.randint(1, 3)),
                "max_distance": random.choice([5.0, 10.0, 25.0, None]),
                "available_times": [
                    {"day": "monday", "start": "18:00", "end": "21:00"},
                    {"day": "wednesday", "start": "19:00", "end": "22:00"},
                    {"day": "saturday", "start": "09:00", "end": "17:00"}
                ],
                "stakes_range": {"min": 0.0, "max": random.choice([10.0, 25.0, 50.0, 100.0])},
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            matchmaking_profiles.append(profile)
    
    if matchmaking_profiles:
        await db.challenge_matchmaking.insert_many(matchmaking_profiles)
        print(f"✅ Created {len(matchmaking_profiles)} matchmaking profiles")
    
    print(f"\n🎉 Successfully populated M2DG Basketball App Phase 2 data!")
    print(f"📊 Phase 2 Database Summary:")
    print(f"   📱 RFID Cards: {len(rfid_cards)}")
    print(f"   📋 RFID Events: {len(rfid_events)}")
    print(f"   👥 Court Presence: {len(court_presence)}")
    print(f"   🏆 Tournaments: {len(tournaments)}")
    print(f"   ⚔️ Tournament Matches: {len(tournament_matches)}")
    print(f"   📺 Live Game Events: {len(live_events)}")
    print(f"   🎯 Matchmaking Profiles: {len(matchmaking_profiles)}")
    
    print(f"\n🔥 Phase 2 Features Now Available:")
    print(f"   ⚡ Real-time WebSocket system at /ws/{{user_id}}")
    print(f"   📱 RFID check-in/out system")
    print(f"   🏆 Tournament management system")
    print(f"   📺 Live game scoring and events")
    print(f"   🎯 Enhanced challenge matchmaking")
    print(f"   👥 Real-time court presence tracking")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(populate_phase2_data())