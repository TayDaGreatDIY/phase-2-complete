import requests
import json
import time
import uuid
import datetime
from typing import Dict, Any, Optional, List

# Get the backend URL from the frontend .env file
BACKEND_URL = "https://55941e8c-7f06-4cfd-a5ef-25621a8c4870.preview.emergentagent.com"
API_URL = f"{BACKEND_URL}/api"

# Test accounts
TEST_ACCOUNTS = {
    "player": {"email": "mike@m2dg.com", "password": "password123"},
    "coach": {"email": "coach@m2dg.com", "password": "password123"},
    "admin": {"email": "admin@m2dg.com", "password": "admin123"}
}

# Store tokens for authenticated requests
tokens = {}
user_ids = {}

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
    create_court_success = response.status_code == 200 and "id" in response.json()
    print_test_result("Create Court (Admin)", create_court_success, response)
    all_passed = all_passed and create_court_success
    
    # Try to create a court as a non-admin (should fail)
    response = make_request("POST", "/courts", data=court_data, token=tokens.get("player"))
    create_court_player_success = response.status_code == 403
    print_test_result("Create Court (Player - Should Fail)", create_court_player_success, response)
    all_passed = all_passed and create_court_player_success
    
    # Get a specific court
    if create_court_success:
        court_id = response.json()["id"]
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
            "max_participants": 2
        }
        
        response = make_request("POST", "/challenges", data=challenge_data, token=tokens.get("player"))
        create_challenge_success = response.status_code == 200 and "id" in response.json()
        print_test_result("Create Challenge", create_challenge_success, response)
        all_passed = all_passed and create_challenge_success
        
        if create_challenge_success:
            challenge_id = response.json()["id"]
            
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

# Run all tests
def run_all_tests():
    print("=== Starting M2DG Basketball API Tests ===")
    
    results = {
        "Health Check": test_health_check(),
        "Authentication": test_authentication(),
        "Users": test_users(),
        "Courts": test_courts(),
        "Challenges": test_challenges(),
        "Coaches": test_coaches(),
        "Games": test_games(),
        "Products": test_products(),
        "Stats": test_stats()
    }
    
    print("\n=== Test Summary ===")
    all_passed = True
    for test_name, result in results.items():
        print(f"{'✅' if result else '❌'} {test_name}: {'PASSED' if result else 'FAILED'}")
        all_passed = all_passed and result
    
    print(f"\nOverall Test Result: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
    return all_passed

if __name__ == "__main__":
    run_all_tests()