from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import health

app = FastAPI(title="Gas Town Meal Planner API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
