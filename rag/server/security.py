# rag/server/security.py
import jwt
import os
from flask import request, g
from functools import wraps

SECRET_KEY = os.getenv('JWT_SECRET')
if not SECRET_KEY:
    raise RuntimeError("JWT_SECRET environment variable must be set.")

def verify_api_token(token):
    try:
        # Decode and verify the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
        return payload['userId']  # Return the user ID from the token
    except jwt.ExpiredSignatureError:
        return None  # Token expired
    except jwt.InvalidTokenError:
        return None  # Invalid token
    except Exception as e:
        print(f"Token verification error: {e}")
        return None

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Get token from Authorization header
        auth_header = request.headers.get('Authorization', '')
        
        if not auth_header.startswith('Bearer '):
            return {'error': 'Missing or invalid token format'}, 401
            
        token = auth_header.split(' ')[1]
        user_id = verify_api_token(token)
        
        if not user_id:
            return {'error': 'Invalid or expired token'}, 401
            
        # Set user_id in Flask's g object for use in route functions
        g.user_id = user_id
        return f(*args, **kwargs)
        
    return decorated_function