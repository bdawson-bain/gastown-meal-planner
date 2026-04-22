from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, feedback, health, keys, meal_plans, users

app = FastAPI(title="Gas Town Meal Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(keys.router)
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(meal_plans.router)
app.include_router(feedback.router)
