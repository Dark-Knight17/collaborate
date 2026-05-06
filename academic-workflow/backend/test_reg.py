from database import SessionLocal
import models
from main import register, UserCreate

db = SessionLocal()
try:
    res = register(UserCreate(email="b@test.com", password="pw", name="Name"), db=db)
    print("Success:", res)
except Exception as e:
    import traceback
    traceback.print_exc()
