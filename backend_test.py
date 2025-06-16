import requests
import json
import time
import uuid
import datetime
import websocket
import threading
import asyncio
from typing import Dict, Any, Optional, List

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://55941e8c-7f06-4cfd-a5ef-25621a8c4870.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"
WS_URL = f"wss://{BACKEND_URL.replace('https://', '')}/ws"

# Test accounts
TEST_ACCOUNTS = {
    "player": {"email": "mike@m2dg.com", "password": "password123"},
    "coach": {"email": "coach@m2dg.com", "password": "password123"},
    "admin": {"email": "admin@m2dg.com", "password": "admin123"}
}

# Store tokens for authenticated requests
tokens = {}
user_ids = {}

# Store created resources for testing
created_resources = {
    "courts": [],
    "rfid_cards": [],
    "tournaments": [],
    "games": [],
    "challenges": []
}

# WebSocket message queue for testing
ws_messages = []
ws_connected = False

# Helper function to make authenticated requests
def make_request(method, endpoint, data=None, token=None, params=None):
    url = f"{API_URL}{endpoint}"
    headers = {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    if method == "GET":
        response = requests.get(url, headers=headers, params=params)
    elif method == "POST":
        response = requests.post(url, json=data, headers=headers)
    elif method == "PUT":
        response = requests.put(url, json=data, headers=headers)
    elif method == "DELETE":
        response = requests.delete(url, headers=headers)
    
    return response

# Helper function to print test results
def print_test_result(test_name, success, response=None, error=None):
    if success:
        print(f"✅ {test_name}: PASSED")
        if response:
            try:
                print(f"   Response: {json.dumps(response.json(), indent=2)[:200]}...")
            except:
                print(f"   Response status: {response.status_code}")
    else:
        print(f"❌ {test_name}: FAILED")
        if error:
            print(f"   Error: {error}")
        if response:
            try:
                print(f"   Response: {response.text[:200]}...")
            except:
                print(f"   Response status: {response.status_code}")

# Test health check endpoint
def test_health_check():
    print("\n=== Testing Health Check Endpoint ===")
    response = make_request("GET", "/health")
    success = response.status_code == 200
    print_test_result("Health Check", success, response)
    return success

# Test authentication endpoints
def test_authentication():
    print("\n=== Testing Authentication Endpoints ===")
    all_passed = True
    
    # Test registration
    new_user_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"testuser_{int(time.time())}@example.com",
        "password": "Password123!",
        "full_name": "Test User",
        "role": "player",
        "skill_level": "intermediate"
    }
    
    response = make_request("POST", "/auth/register", new_user_data)
    register_success = response.status_code == 200 and "access_token" in response.json()
    print_test_result("User Registration", register_success, response)
    all_passed = all_passed and register_success
    
    if register_success:
        # Store the new user's token
        tokens["new_user"] = response.json()["access_token"]
        user_ids["new_user"] = response.json()["user"]["id"]
    
    # Test login for each test account
    for role, credentials in TEST_ACCOUNTS.items():
        response = make_request("POST", "/auth/login", credentials)
        login_success = response.status_code == 200 and "access_token" in response.json()
        print_test_result(f"{role.capitalize()} Login", login_success, response)
        all_passed = all_passed and login_success
        
        if login_success:
            tokens[role] = response.json()["access_token"]
            user_ids[role] = response.json()["user"]["id"]
    
    # Test get current user info
    for role in tokens.keys():
        response = make_request("GET", "/auth/me", token=tokens[role])
        me_success = response.status_code == 200 and "id" in response.json()
        print_test_result(f"Get {role.capitalize()} Info", me_success, response)
        all_passed = all_passed and me_success
    
    return all_passed

# Test user endpoints
def test_users():
    print("\n=== Testing User Endpoints ===")
    all_passed = True
    
    # Test get all users
    response = make_request("GET", "/users", token=tokens.get("admin"))
    list_users_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List All Users", list_users_success, response)
    all_passed = all_passed and list_users_success
    
    # Test get specific user
    for role, user_id in user_ids.items():
        response = make_request("GET", f"/users/{user_id}", token=tokens.get("admin"))
        get_user_success = response.status_code == 200 and response.json()["id"] == user_id
        print_test_result(f"Get {role.capitalize()} User", get_user_success, response)
        all_passed = all_passed and get_user_success
    
    return all_passed

# Test court endpoints
def test_courts():
    print("\n=== Testing Court Endpoints ===")
    all_passed = True
    
    # Test get all courts
    response = make_request("GET", "/courts")
    list_courts_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List All Courts", list_courts_success, response)
    all_passed = all_passed and list_courts_success
    
    # Create a new court (admin only)
    court_data = {
        "name": f"Test Court {int(time.time())}",
        "description": "A test basketball court",
        "location": "Test Location",
        "address": "123 Test Street, Test City",
        "surface_type": "indoor",
        "lighting": True,
        "covered": True,
        "max_players": 10,
        "amenities": ["Showers", "Lockers", "Water Fountains"]
    }
    
    response = make_request("POST", "/courts", data=court_data, token=tokens.get("admin"))
    create_court_success = response.status_code == 200
    print_test_result("Create Court (Admin)", create_court_success, response)
    all_passed = all_passed and create_court_success
    
    if create_court_success:
        created_resources["courts"].append(response.json()["id"])
    
    # Try to create a court as a non-admin (should fail)
    response = make_request("POST", "/courts", data=court_data, token=tokens.get("player"))
    create_court_player_success = response.status_code == 403
    print_test_result("Create Court (Player - Should Fail)", create_court_player_success, response)
    all_passed = all_passed and create_court_player_success
    
    # Get a specific court from the list
    courts_response = make_request("GET", "/courts")
    if courts_response.status_code == 200 and len(courts_response.json()) > 0:
        court_id = courts_response.json()[0]["id"]
        response = make_request("GET", f"/courts/{court_id}")
        get_court_success = response.status_code == 200 and response.json()["id"] == court_id
        print_test_result("Get Specific Court", get_court_success, response)
        all_passed = all_passed and get_court_success
    
    return all_passed

# Test challenge endpoints
def test_challenges():
    print("\n=== Testing Challenge Endpoints ===")
    all_passed = True
    
    # Get all challenges
    response = make_request("GET", "/challenges", token=tokens.get("player"))
    list_challenges_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List All Challenges", list_challenges_success, response)
    all_passed = all_passed and list_challenges_success
    
    # Get challenges with status filter
    response = make_request("GET", "/challenges", token=tokens.get("player"), params={"status": "pending"})
    filter_challenges_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List Challenges with Status Filter", filter_challenges_success, response)
    all_passed = all_passed and filter_challenges_success
    
    # Create a new challenge
    # First, get a court ID
    courts_response = make_request("GET", "/courts")
    if courts_response.status_code == 200 and len(courts_response.json()) > 0:
        court_id = courts_response.json()[0]["id"]
        
        # Create challenge
        challenge_data = {
            "court_id": court_id,
            "title": f"Test Challenge {int(time.time())}",
            "description": "A test basketball challenge",
            "skill_level_required": "intermediate",
            "game_type": "1v1",
            "scheduled_time": (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat(),
            "max_participants": 2,
            "challenger_id": user_ids.get("player")  # Add this line
        }
        
        response = make_request("POST", "/challenges", data=challenge_data, token=tokens.get("player"))
        create_challenge_success = response.status_code == 200
        print_test_result("Create Challenge", create_challenge_success, response)
        all_passed = all_passed and create_challenge_success
        
        if create_challenge_success:
            challenge_id = response.json()["id"]
            created_resources["challenges"].append(challenge_id)
            
            # Get specific challenge
            response = make_request("GET", f"/challenges/{challenge_id}", token=tokens.get("player"))
            get_challenge_success = response.status_code == 200 and response.json()["id"] == challenge_id
            print_test_result("Get Specific Challenge", get_challenge_success, response)
            all_passed = all_passed and get_challenge_success
            
            # Accept challenge (as a different user)
            response = make_request("PUT", f"/challenges/{challenge_id}/accept", token=tokens.get("coach"))
            accept_challenge_success = response.status_code == 200 and "message" in response.json()
            print_test_result("Accept Challenge", accept_challenge_success, response)
            all_passed = all_passed and accept_challenge_success
    else:
        print_test_result("Create Challenge", False, error="No courts available to create challenge")
        all_passed = False
    
    return all_passed

# Test coach endpoints
def test_coaches():
    print("\n=== Testing Coach Endpoints ===")
    all_passed = True
    
    # Get all coaches
    response = make_request("GET", "/coaches")
    list_coaches_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List All Coaches", list_coaches_success, response)
    all_passed = all_passed and list_coaches_success
    
    # Get a specific coach if any exist
    if list_coaches_success and len(response.json()) > 0:
        coach_id = response.json()[0]["id"]
        response = make_request("GET", f"/coaches/{coach_id}")
        get_coach_success = response.status_code == 200 and response.json()["id"] == coach_id
        print_test_result("Get Specific Coach", get_coach_success, response)
        all_passed = all_passed and get_coach_success
    
    return all_passed

# Test game endpoints
def test_games():
    print("\n=== Testing Game Endpoints ===")
    all_passed = True
    
    # Get all games
    response = make_request("GET", "/games", token=tokens.get("player"))
    list_games_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List All Games", list_games_success, response)
    all_passed = all_passed and list_games_success
    
    # Get games with status filter
    response = make_request("GET", "/games", token=tokens.get("player"), params={"status": "scheduled"})
    filter_games_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List Games with Status Filter", filter_games_success, response)
    all_passed = all_passed and filter_games_success
    
    # Create a new game
    # First, get a court ID
    courts_response = make_request("GET", "/courts")
    if courts_response.status_code == 200 and len(courts_response.json()) > 0:
        court_id = courts_response.json()[0]["id"]
        
        # Create game
        game_data = {
            "court_id": court_id,
            "players": [user_ids.get("player"), user_ids.get("coach")],
            "game_type": "casual",
            "scheduled_time": (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat(),
            "status": "scheduled"
        }
        
        response = make_request("POST", "/games", data=game_data, token=tokens.get("player"))
        create_game_success = response.status_code == 200 and "id" in response.json()
        print_test_result("Create Game", create_game_success, response)
        all_passed = all_passed and create_game_success
        
        if create_game_success:
            created_resources["games"].append(response.json()["id"])
    else:
        print_test_result("Create Game", False, error="No courts available to create game")
        all_passed = False
    
    return all_passed

# Test product endpoints
def test_products():
    print("\n=== Testing Product Endpoints ===")
    all_passed = True
    
    # Get all products
    response = make_request("GET", "/products")
    list_products_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List All Products", list_products_success, response)
    all_passed = all_passed and list_products_success
    
    # Get products with category filter
    response = make_request("GET", "/products", params={"category": "shoes"})
    filter_products_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("List Products with Category Filter", filter_products_success, response)
    all_passed = all_passed and filter_products_success
    
    # Get a specific product if any exist
    if list_products_success and len(response.json()) > 0:
        product_id = response.json()[0]["id"]
        response = make_request("GET", f"/products/{product_id}")
        get_product_success = response.status_code == 200 and response.json()["id"] == product_id
        print_test_result("Get Specific Product", get_product_success, response)
        all_passed = all_passed and get_product_success
    
    return all_passed

# Test stats endpoints
def test_stats():
    print("\n=== Testing Stats Endpoints ===")
    all_passed = True
    
    # Get user stats
    for role, user_id in user_ids.items():
        response = make_request("GET", f"/stats/user/{user_id}", token=tokens.get(role))
        get_stats_success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result(f"Get {role.capitalize()} Stats", get_stats_success, response)
        all_passed = all_passed and get_stats_success
    
    # Create player stats
    # First, get a game ID if any exist
    games_response = make_request("GET", "/games", token=tokens.get("player"))
    if games_response.status_code == 200 and len(games_response.json()) > 0:
        game_id = games_response.json()[0]["id"]
        
        # Create stats
        stats_data = {
            "user_id": user_ids.get("player"),
            "game_id": game_id,
            "points": 20,
            "rebounds": 5,
            "assists": 3,
            "steals": 2,
            "blocks": 1,
            "turnovers": 1,
            "field_goals_made": 8,
            "field_goals_attempted": 15,
            "three_pointers_made": 2,
            "three_pointers_attempted": 5,
            "free_throws_made": 2,
            "free_throws_attempted": 3,
            "minutes_played": 30
        }
        
        response = make_request("POST", "/stats", data=stats_data, token=tokens.get("player"))
        create_stats_success = response.status_code == 200 and "id" in response.json()
        print_test_result("Create Player Stats", create_stats_success, response)
        all_passed = all_passed and create_stats_success
    else:
        print_test_result("Create Player Stats", False, error="No games available to create stats")
        all_passed = False
    
    return all_passed

# WebSocket message handler
def on_message(ws, message):
    global ws_messages
    try:
        msg = json.loads(message)
        ws_messages.append(msg)
        print(f"Received WebSocket message: {message[:100]}...")
    except Exception as e:
        print(f"Error processing WebSocket message: {e}")

def on_error(ws, error):
    print(f"WebSocket error: {error}")

def on_close(ws, close_status_code, close_msg):
    global ws_connected
    ws_connected = False
    print(f"WebSocket connection closed: {close_status_code} - {close_msg}")

def on_open(ws):
    global ws_connected
    ws_connected = True
    print("WebSocket connection established")
    # Send a ping message
    ws.send(json.dumps({"type": "ping"}))

# Test WebSocket system
def test_websocket_system():
    print("\n=== Testing WebSocket System ===")
    all_passed = True
    
    # Test WebSocket connection statistics endpoint
    response = make_request("GET", "/websocket/stats", token=tokens.get("admin"))
    stats_success = response.status_code == 200 and "total_connections" in response.json()
    print_test_result("WebSocket Stats Endpoint", stats_success, response)
    all_passed = all_passed and stats_success
    
    # Test WebSocket connection
    if "player" in user_ids:
        try:
            # Create WebSocket connection
            ws_thread = None
            
            def run_websocket():
                ws_url = f"{WS_URL}/{user_ids['player']}"
                ws = websocket.WebSocketApp(
                    ws_url,
                    on_open=on_open,
                    on_message=on_message,
                    on_error=on_error,
                    on_close=on_close
                )
                ws.run_forever(ping_interval=30)
            
            # Start WebSocket in a separate thread
            ws_thread = threading.Thread(target=run_websocket)
            ws_thread.daemon = True
            ws_thread.start()
            
            # Wait for connection to establish
            time.sleep(3)
            
            # Check if connection was successful
            ws_connection_success = ws_connected and len(ws_messages) > 0
            print_test_result("WebSocket Connection", ws_connection_success, 
                             error="Failed to establish WebSocket connection" if not ws_connection_success else None)
            all_passed = all_passed and ws_connection_success
            
            # Check connection stats again to see if our connection was counted
            if ws_connection_success:
                response = make_request("GET", "/websocket/stats", token=tokens.get("admin"))
                stats_update_success = response.status_code == 200 and response.json()["total_connections"] > 0
                print_test_result("WebSocket Connection Counted", stats_update_success, response)
                all_passed = all_passed and stats_update_success
            
        except Exception as e:
            print_test_result("WebSocket Connection", False, error=f"Exception: {str(e)}")
            all_passed = False
    else:
        print_test_result("WebSocket Connection", False, error="No player user ID available for testing")
        all_passed = False
    
    return all_passed

# Test RFID system
def test_rfid_system():
    print("\n=== Testing RFID System ===")
    all_passed = True
    
    # Create RFID card
    card_uid = f"RFID{int(time.time())}"
    card_data = {
        "card_uid": card_uid,
        "user_id": user_ids.get("player"),
        "card_type": "standard",
        "access_level": 1
    }
    
    response = make_request("POST", "/rfid/cards", data=card_data, token=tokens.get("player"))
    create_card_success = response.status_code == 200 and "id" in response.json()
    print_test_result("Create RFID Card", create_card_success, response)
    all_passed = all_passed and create_card_success
    
    if create_card_success:
        created_resources["rfid_cards"].append(response.json()["id"])
    
    # Get user's RFID cards
    response = make_request("GET", "/rfid/cards", token=tokens.get("player"))
    get_cards_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("Get User's RFID Cards", get_cards_success, response)
    all_passed = all_passed and get_cards_success
    
    # Get specific user's RFID cards (as admin)
    response = make_request("GET", f"/rfid/cards/user/{user_ids.get('player')}", token=tokens.get("admin"))
    get_user_cards_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("Get Specific User's RFID Cards (Admin)", get_user_cards_success, response)
    all_passed = all_passed and get_user_cards_success
    
    # Try to get another user's RFID cards (as player - should fail)
    response = make_request("GET", f"/rfid/cards/user/{user_ids.get('coach')}", token=tokens.get("player"))
    get_other_cards_success = response.status_code == 403
    print_test_result("Get Other User's RFID Cards (Should Fail)", get_other_cards_success, response)
    all_passed = all_passed and get_other_cards_success
    
    # RFID check-in
    # First, get a court ID
    courts_response = make_request("GET", "/courts")
    if courts_response.status_code == 200 and len(courts_response.json()) > 0:
        court_id = courts_response.json()[0]["id"]
        
        # Check-in request
        checkin_data = {
            "card_uid": card_uid,
            "court_id": court_id,
            "device_id": "test_device_001"
        }
        
        response = make_request("POST", "/rfid/checkin", data=checkin_data)
        checkin_success = response.status_code == 200 and response.json()["success"]
        print_test_result("RFID Check-in", checkin_success, response)
        all_passed = all_passed and checkin_success
        
        # Try to check-in again (should fail)
        response = make_request("POST", "/rfid/checkin", data=checkin_data)
        checkin_again_success = response.status_code == 400
        print_test_result("RFID Check-in Again (Should Fail)", checkin_again_success, response)
        all_passed = all_passed and checkin_again_success
        
        # Check-out request
        checkout_data = {
            "card_uid": card_uid,
            "court_id": court_id,
            "device_id": "test_device_001"
        }
        
        response = make_request("POST", "/rfid/checkout", data=checkout_data)
        checkout_success = response.status_code == 200 and response.json()["success"]
        print_test_result("RFID Check-out", checkout_success, response)
        all_passed = all_passed and checkout_success
        
        # Get RFID events
        response = make_request("GET", "/rfid/events", token=tokens.get("player"))
        get_events_success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get RFID Events", get_events_success, response)
        all_passed = all_passed and get_events_success
        
        # Get RFID events with filters (as admin)
        response = make_request("GET", "/rfid/events", token=tokens.get("admin"), 
                               params={"court_id": court_id, "user_id": user_ids.get("player")})
        get_filtered_events_success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get Filtered RFID Events (Admin)", get_filtered_events_success, response)
        all_passed = all_passed and get_filtered_events_success
    else:
        print_test_result("RFID Check-in/out", False, error="No courts available for testing")
        all_passed = False
    
    return all_passed

# Test court presence tracking
def test_court_presence():
    print("\n=== Testing Court Presence Tracking ===")
    all_passed = True
    
    # Get court presence
    # First, get a court ID
    courts_response = make_request("GET", "/courts")
    if courts_response.status_code == 200 and len(courts_response.json()) > 0:
        court_id = courts_response.json()[0]["id"]
        
        response = make_request("GET", f"/courts/{court_id}/presence")
        get_presence_success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get Court Presence", get_presence_success, response)
        all_passed = all_passed and get_presence_success
        
        # Get user presence history
        response = make_request("GET", f"/presence/user/{user_ids.get('player')}", token=tokens.get("player"))
        get_user_presence_success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get User Presence History", get_user_presence_success, response)
        all_passed = all_passed and get_user_presence_success
        
        # Try to get another user's presence history (as player - should fail)
        response = make_request("GET", f"/presence/user/{user_ids.get('coach')}", token=tokens.get("player"))
        get_other_presence_success = response.status_code == 403
        print_test_result("Get Other User's Presence History (Should Fail)", get_other_presence_success, response)
        all_passed = all_passed and get_other_presence_success
        
        # Get another user's presence history (as admin - should succeed)
        response = make_request("GET", f"/presence/user/{user_ids.get('player')}", token=tokens.get("admin"))
        get_admin_presence_success = response.status_code == 200 and isinstance(response.json(), list)
        print_test_result("Get User Presence History (Admin)", get_admin_presence_success, response)
        all_passed = all_passed and get_admin_presence_success
    else:
        print_test_result("Court Presence Tracking", False, error="No courts available for testing")
        all_passed = False
    
    return all_passed

# Test tournament management
def test_tournament_management():
    print("\n=== Testing Tournament Management ===")
    all_passed = True
    
    # Create tournament
    # First, get a court ID
    courts_response = make_request("GET", "/courts")
    if courts_response.status_code == 200 and len(courts_response.json()) > 0:
        court_id = courts_response.json()[0]["id"]
        
        tournament_data = {
            "name": f"Test Tournament {int(time.time())}",
            "description": "A test basketball tournament",
            "format": "single_elimination",
            "game_type": "3v3",
            "max_participants": 8,
            "entry_fee": 10.0,
            "registration_start": datetime.datetime.utcnow().isoformat(),
            "registration_end": (datetime.datetime.utcnow() + datetime.timedelta(days=7)).isoformat(),
            "tournament_start": (datetime.datetime.utcnow() + datetime.timedelta(days=10)).isoformat(),
            "court_ids": [court_id],
            "rules": ["Standard basketball rules", "15-minute games", "First to 21 points"],
            "requirements": {"min_skill_level": "intermediate"}
        }
        
        response = make_request("POST", "/tournaments", data=tournament_data, token=tokens.get("admin"))
        create_tournament_success = response.status_code == 200 and "id" in response.json()
        print_test_result("Create Tournament", create_tournament_success, response)
        all_passed = all_passed and create_tournament_success
        
        if create_tournament_success:
            tournament_id = response.json()["id"]
            created_resources["tournaments"].append(tournament_id)
            
            # Get tournaments
            response = make_request("GET", "/tournaments")
            get_tournaments_success = response.status_code == 200 and isinstance(response.json(), list)
            print_test_result("Get Tournaments", get_tournaments_success, response)
            all_passed = all_passed and get_tournaments_success
            
            # Get tournaments with filters
            response = make_request("GET", "/tournaments", params={"status": "registration_open", "is_public": "true"})
            get_filtered_tournaments_success = response.status_code == 200 and isinstance(response.json(), list)
            print_test_result("Get Filtered Tournaments", get_filtered_tournaments_success, response)
            all_passed = all_passed and get_filtered_tournaments_success
            
            # Get specific tournament
            response = make_request("GET", f"/tournaments/{tournament_id}")
            get_tournament_success = response.status_code == 200 and response.json()["id"] == tournament_id
            print_test_result("Get Specific Tournament", get_tournament_success, response)
            all_passed = all_passed and get_tournament_success
            
            # Register for tournament
            registration_data = {
                "tournament_id": tournament_id,
                "team_name": "Test Team"
            }
            
            response = make_request("POST", f"/tournaments/{tournament_id}/register", 
                                   data=registration_data, token=tokens.get("player"))
            register_tournament_success = response.status_code == 200 and "message" in response.json()
            print_test_result("Register for Tournament", register_tournament_success, response)
            all_passed = all_passed and register_tournament_success
            
            # Get tournament matches
            response = make_request("GET", f"/tournaments/{tournament_id}/matches")
            get_matches_success = response.status_code == 200 and isinstance(response.json(), list)
            print_test_result("Get Tournament Matches", get_matches_success, response)
            all_passed = all_passed and get_matches_success
    else:
        print_test_result("Tournament Management", False, error="No courts available for testing")
        all_passed = False
    
    return all_passed

# Test live game scoring
def test_live_game_scoring():
    print("\n=== Testing Live Game Scoring ===")
    all_passed = True
    
    # First, create a game for testing
    courts_response = make_request("GET", "/courts")
    if courts_response.status_code == 200 and len(courts_response.json()) > 0:
        court_id = courts_response.json()[0]["id"]
        
        # Create game
        game_data = {
            "court_id": court_id,
            "players": [user_ids.get("player"), user_ids.get("coach")],
            "game_type": "casual",
            "scheduled_time": datetime.datetime.utcnow().isoformat(),
            "status": "in_progress"
        }
        
        response = make_request("POST", "/games", data=game_data, token=tokens.get("player"))
        create_game_success = response.status_code == 200 and "id" in response.json()
        print_test_result("Create Game for Live Scoring", create_game_success, response)
        all_passed = all_passed and create_game_success
        
        if create_game_success:
            game_id = response.json()["id"]
            created_resources["games"].append(game_id)
            
            # Join game session
            response = make_request("POST", f"/games/{game_id}/join", 
                                   params={"session_type": "live_scoring"}, token=tokens.get("player"))
            join_game_success = response.status_code == 200 and "message" in response.json()
            print_test_result("Join Game Session", join_game_success, response)
            all_passed = all_passed and join_game_success
            
            # Update live score
            score_data = {
                "team1_score": 10,
                "team2_score": 8,
                "game_time": "00:05:30",
                "period": 1,
                "event_description": "Player scored a 2-pointer"
            }
            
            response = make_request("POST", f"/games/{game_id}/score", 
                                   data=score_data, token=tokens.get("player"))
            update_score_success = response.status_code == 200 and "message" in response.json()
            print_test_result("Update Live Score", update_score_success, response)
            all_passed = all_passed and update_score_success
            
            # Get game events
            response = make_request("GET", f"/games/{game_id}/events")
            get_events_success = response.status_code == 200 and isinstance(response.json(), list)
            print_test_result("Get Game Events", get_events_success, response)
            all_passed = all_passed and get_events_success
            
            # Update score again
            score_data = {
                "team1_score": 12,
                "team2_score": 8,
                "game_time": "00:06:15",
                "period": 1,
                "event_description": "Player scored another 2-pointer"
            }
            
            response = make_request("POST", f"/games/{game_id}/score", 
                                   data=score_data, token=tokens.get("player"))
            update_score_again_success = response.status_code == 200 and "message" in response.json()
            print_test_result("Update Live Score Again", update_score_again_success, response)
            all_passed = all_passed and update_score_again_success
            
            # Check if events were recorded
            response = make_request("GET", f"/games/{game_id}/events")
            events_recorded_success = response.status_code == 200 and len(response.json()) >= 2
            print_test_result("Game Events Recorded", events_recorded_success, response)
            all_passed = all_passed and events_recorded_success
    else:
        print_test_result("Live Game Scoring", False, error="No courts available for testing")
        all_passed = False
    
    return all_passed

# Test enhanced challenge system
def test_enhanced_challenge_system():
    print("\n=== Testing Enhanced Challenge System ===")
    all_passed = True
    
    # Create matchmaking profile
    matchmaking_data = {
        "preferred_skill_levels": ["beginner", "intermediate"],
        "preferred_game_types": ["1v1", "2v2"],
        "max_distance": 10.0,
        "available_times": [
            {"day": "monday", "start": "18:00", "end": "20:00"},
            {"day": "wednesday", "start": "18:00", "end": "20:00"}
        ],
        "stakes_range": {"min": 0.0, "max": 50.0}
    }
    
    response = make_request("POST", "/challenges/matchmaking", 
                           data=matchmaking_data, token=tokens.get("player"))
    create_matchmaking_success = response.status_code == 200 and "message" in response.json()
    print_test_result("Create Matchmaking Profile", create_matchmaking_success, response)
    all_passed = all_passed and create_matchmaking_success
    
    # Create another matchmaking profile for the coach
    matchmaking_data["preferred_skill_levels"] = ["intermediate", "advanced"]
    response = make_request("POST", "/challenges/matchmaking", 
                           data=matchmaking_data, token=tokens.get("coach"))
    create_coach_matchmaking_success = response.status_code == 200 and "message" in response.json()
    print_test_result("Create Coach Matchmaking Profile", create_coach_matchmaking_success, response)
    all_passed = all_passed and create_coach_matchmaking_success
    
    # Get matchmaking suggestions
    response = make_request("GET", "/challenges/matchmaking/suggestions", token=tokens.get("player"))
    get_suggestions_success = response.status_code == 200 and isinstance(response.json(), list)
    print_test_result("Get Matchmaking Suggestions", get_suggestions_success, response)
    all_passed = all_passed and get_suggestions_success
    
    return all_passed

# Run all tests
def run_all_tests():
    print("=== Starting M2DG Basketball API Tests ===")
    
    # First, run authentication to get tokens
    test_authentication()
    
    # Phase 1 tests
    phase1_results = {
        "Health Check": test_health_check(),
        "Users": test_users(),
        "Courts": test_courts(),
        "Challenges": test_challenges(),
        "Coaches": test_coaches(),
        "Games": test_games(),
        "Products": test_products(),
        "Stats": test_stats()
    }
    
    # Phase 2 tests
    phase2_results = {
        "WebSocket System": test_websocket_system(),
        "RFID System": test_rfid_system(),
        "Court Presence Tracking": test_court_presence(),
        "Tournament Management": test_tournament_management(),
        "Live Game Scoring": test_live_game_scoring(),
        "Enhanced Challenge System": test_enhanced_challenge_system()
    }
    
    print("\n=== Test Summary ===")
    print("\nPhase 1 Features:")
    phase1_passed = True
    for test_name, result in phase1_results.items():
        print(f"{'✅' if result else '❌'} {test_name}: {'PASSED' if result else 'FAILED'}")
        phase1_passed = phase1_passed and result
    
    print("\nPhase 2 Features:")
    phase2_passed = True
    for test_name, result in phase2_results.items():
        print(f"{'✅' if result else '❌'} {test_name}: {'PASSED' if result else 'FAILED'}")
        phase2_passed = phase2_passed and result
    
    all_passed = phase1_passed and phase2_passed
    print(f"\nOverall Test Result: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    return all_passed

if __name__ == "__main__":
    run_all_tests()