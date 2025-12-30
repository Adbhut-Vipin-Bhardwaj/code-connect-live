"""
Simple test script to verify the API endpoints
"""
import requests
import json
import pytest

BASE_URL = "http://localhost:3000/v1"

@pytest.fixture(scope="module")
def session_id():
    """Fixture to create a session and return its ID"""
    response = requests.post(
        f"{BASE_URL}/sessions",
        json={"title": "Test Session", "language": "python"}
    )
    assert response.status_code == 201
    session = response.json()
    print(f"Session ID: {session['id']}")
    print(f"Session Title: {session['title']}")
    print(f"Language: {session['language']}")
    return session['id']

def test_create_session():
    """Test creating a new session"""
    response = requests.post(
        f"{BASE_URL}/sessions",
        json={"title": "Test Session", "language": "python"}
    )
    print(f"Create Session: {response.status_code}")
    assert response.status_code == 201
    session = response.json()
    print(f"Session ID: {session['id']}")
    print(f"Session Title: {session['title']}")
    print(f"Language: {session['language']}")

def test_get_session(session_id):
    """Test getting session details"""
    response = requests.get(f"{BASE_URL}/sessions/{session_id}")
    print(f"Get Session: {response.status_code}")
    assert response.status_code == 200
    session = response.json()
    print(f"Retrieved session: {session['title']}")

def test_update_code(session_id):
    """Test updating session code"""
    response = requests.put(
        f"{BASE_URL}/sessions/{session_id}",
        json={"code": "print('Updated code!')"}
    )
    print(f"Update Code: {response.status_code}")
    assert response.status_code == 200

def test_join_session(session_id):
    """Test joining a session"""
    response = requests.post(
        f"{BASE_URL}/sessions/{session_id}/participants",
        json={"name": "Test User"}
    )
    print(f"Join Session: {response.status_code}")
    assert response.status_code == 200
    participant = response.json()
    print(f"Participant ID: {participant['id']}")
    print(f"Participant Name: {participant['name']}")

if __name__ == "__main__":
    print("Testing Code Connect Live API")
    print("=" * 50)
    
    # Test create session
    session_id = test_create_session()
    print()
    
    if session_id:
        # Test get session
        test_get_session(session_id)
        print()
        
        # Test update code
        test_update_code(session_id)
        print()
        
        # Test join session
        test_join_session(session_id)
        print()
    
    # Test code execution
    test_execute_code()
    print()
    
    print("=" * 50)
    print("Testing complete!")
