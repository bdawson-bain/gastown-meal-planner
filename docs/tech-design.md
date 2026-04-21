# Tech Design: Gas Town Meal Planner v1

**Status:** Draft  
**Date:** 2026-04-21  
**Stack:** React + Tailwind (frontend), FastAPI (backend), PostgreSQL (database), OpenAI (meal generation)

---

## Overview

Gas Town Meal Planner is a single-user meal planning web app for fitness-focused singles. The system is a standard three-tier web app: a React SPA, a FastAPI REST backend, and a PostgreSQL database. OpenAI is used for AI-assisted meal plan generation via the user's own API key (BYOK).

---

## Architecture Diagram (Docker Compose)

```
┌─────────────────────────────────────────────────────────────────┐
│  docker-compose                                                  │
│                                                                  │
│  ┌─────────────────┐       ┌─────────────────┐                  │
│  │    frontend      │       │    backend       │                  │
│  │  React + Tailwind│──────▶│    FastAPI       │                  │
│  │  port 3000       │ HTTP  │    port 8000     │                  │
│  └─────────────────┘       └────────┬────────┘                  │
│                                      │                           │
│              ┌───────────────────────┤                           │
│              │                       │                           │
│              ▼                       ▼                           │
│  ┌─────────────────┐       ┌─────────────────┐                  │
│  │    postgres      │       │   openai (ext)  │                  │
│  │    port 5432     │       │   api.openai.com│                  │
│  │    db: mealplanner│      │   (user BYOK)   │                  │
│  └─────────────────┘       └─────────────────┘                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Services:**

| Service    | Image                  | Port | Purpose                             |
|------------|------------------------|------|-------------------------------------|
| `frontend` | node:20-alpine (build) | 3000 | React SPA served by Vite dev server |
| `backend`  | python:3.12-slim       | 8000 | FastAPI REST API + business logic   |
| `postgres` | postgres:16-alpine     | 5432 | Primary data store                  |

The frontend calls the backend over HTTP. The backend owns all database access. OpenAI API calls are made server-side (never from the browser) so the user's API key is not exposed to the network.

---

## Data Model / Entities

### Entity Relationship Summary

```
users
  └── user_preferences (1:1)
  └── meals (1:N, custom meals only)
  └── user_favorites (N:M via meal_id)
  └── meal_plans (1:N)
        └── meal_plan_slots (1:N)
              └── meals (N:1)
        └── grocery_lists (1:1)
  └── feedback (1:N)
```

### Table Definitions

#### `users`

| Column        | Type                     | Notes                        |
|---------------|--------------------------|------------------------------|
| id            | UUID PRIMARY KEY         | gen_random_uuid()            |
| email         | TEXT UNIQUE NOT NULL     |                              |
| password_hash | TEXT NOT NULL            | bcrypt                       |
| created_at    | TIMESTAMPTZ DEFAULT now()|                              |
| updated_at    | TIMESTAMPTZ DEFAULT now()|                              |

#### `user_preferences`

One row per user. Created at registration with defaults.

| Column              | Type                | Notes                                          |
|---------------------|---------------------|------------------------------------------------|
| user_id             | UUID PK, FK→users   | 1:1 with users                                 |
| training_phase      | TEXT NOT NULL       | 'cut' \| 'bulk' \| 'maintenance'               |
| daily_calories_kcal | INTEGER NOT NULL    | User's daily calorie target                    |
| protein_g           | INTEGER NOT NULL    | Daily protein target in grams                  |
| carbs_g             | INTEGER NOT NULL    | Daily carb target in grams                     |
| fat_g               | INTEGER NOT NULL    | Daily fat target in grams                      |
| dietary_flags       | JSONB DEFAULT '[]'  | e.g. ["vegetarian", "gluten-free"]             |
| allergy_flags       | JSONB DEFAULT '[]'  | e.g. ["nuts", "shellfish"]                     |
| weekday_prep_min    | INTEGER DEFAULT 30  | Max weekday prep time per meal (minutes)       |
| weekend_batch_min   | INTEGER DEFAULT 120 | Weekend batch-cook availability (minutes)      |
| openai_api_key_enc  | TEXT                | AES-256-GCM encrypted; null if not configured  |
| updated_at          | TIMESTAMPTZ         |                                                |

#### `meals`

Curated meals (source='curated', created_by_user_id=NULL) and user-created custom meals.

| Column            | Type                      | Notes                                         |
|-------------------|---------------------------|-----------------------------------------------|
| id                | UUID PRIMARY KEY          |                                               |
| name              | TEXT NOT NULL             |                                               |
| calories_kcal     | INTEGER NOT NULL          |                                               |
| protein_g         | NUMERIC(6,1) NOT NULL     |                                               |
| carbs_g           | NUMERIC(6,1) NOT NULL     |                                               |
| fat_g             | NUMERIC(6,1) NOT NULL     |                                               |
| prep_time_min     | INTEGER NOT NULL          |                                               |
| ingredients       | JSONB NOT NULL            | [{name, quantity, unit}]                      |
| prep_notes        | TEXT                      | One-paragraph prep description                |
| source            | TEXT NOT NULL             | 'curated' \| 'custom'                         |
| created_by_user_id| UUID FK→users             | NULL for curated meals                        |
| tags              | TEXT[] DEFAULT '{}'       | ['vegetarian','gluten-free', ...]             |
| created_at        | TIMESTAMPTZ DEFAULT now() |                                               |

**Indexes:** `(source, tags)` for library filtering; `(created_by_user_id)` for custom meal lookup.

#### `user_favorites`

| Column   | Type          | Notes               |
|----------|---------------|---------------------|
| user_id  | UUID FK→users |                     |
| meal_id  | UUID FK→meals |                     |
| PRIMARY KEY (user_id, meal_id) | | |

#### `meal_plans`

One plan per user per week. `week_start` is always a Monday.

| Column     | Type                      | Notes                        |
|------------|---------------------------|------------------------------|
| id         | UUID PRIMARY KEY          |                              |
| user_id    | UUID FK→users NOT NULL    |                              |
| week_start | DATE NOT NULL             | Monday of the plan week      |
| created_at | TIMESTAMPTZ DEFAULT now() |                              |
| updated_at | TIMESTAMPTZ DEFAULT now() |                              |
| UNIQUE (user_id, week_start) | | One plan per user per week |

#### `meal_plan_slots`

| Column      | Type                         | Notes                                       |
|-------------|------------------------------|---------------------------------------------|
| id          | UUID PRIMARY KEY             |                                             |
| plan_id     | UUID FK→meal_plans NOT NULL  |                                             |
| day_of_week | SMALLINT NOT NULL            | 0=Monday … 6=Sunday                        |
| slot_type   | TEXT NOT NULL                | 'breakfast' \| 'lunch' \| 'dinner' \| 'snack' |
| meal_id     | UUID FK→meals                | NULL = empty slot                           |
| UNIQUE (plan_id, day_of_week, slot_type) | | One meal per slot |

#### `grocery_lists`

Generated from a plan; regenerated on demand (previous list is replaced).

| Column       | Type                         | Notes                                        |
|--------------|------------------------------|----------------------------------------------|
| id           | UUID PRIMARY KEY             |                                              |
| plan_id      | UUID FK→meal_plans UNIQUE    | One list per plan                            |
| user_id      | UUID FK→users NOT NULL       |                                              |
| items        | JSONB NOT NULL               | See structure below                          |
| generated_at | TIMESTAMPTZ DEFAULT now()    |                                              |
| share_token  | TEXT UNIQUE                  | Random token for shareable read-only URL     |

**`items` JSONB structure:**
```json
[
  {
    "category": "proteins",
    "items": [
      { "name": "Chicken breast", "quantity": 2.4, "unit": "lbs", "checked": false }
    ]
  }
]
```

Categories: `proteins`, `produce`, `dairy_refrigerated`, `pantry_dry`.

#### `feedback`

User ratings on meals, used to personalize AI generation prompts.

| Column     | Type                      | Notes                                  |
|------------|---------------------------|----------------------------------------|
| id         | UUID PRIMARY KEY          |                                        |
| user_id    | UUID FK→users NOT NULL    |                                        |
| meal_id    | UUID FK→meals NOT NULL    |                                        |
| plan_id    | UUID FK→meal_plans        | NULL if submitted outside a plan       |
| rating     | SMALLINT NOT NULL         | 1–5                                    |
| notes      | TEXT                      | Optional free-text comment             |
| created_at | TIMESTAMPTZ DEFAULT now() |                                        |
| UNIQUE (user_id, meal_id, plan_id) | | One rating per meal per plan |

---

## API Surface

Base URL: `/api/v1`

Authentication: JWT bearer token (issued at login, 7-day expiry). All endpoints except `/auth/register` and `/auth/login` require a valid token.

### Auth

| Method | Path              | Description                        |
|--------|-------------------|------------------------------------|
| POST   | /auth/register    | Create account                     |
| POST   | /auth/login       | Authenticate, receive JWT          |
| POST   | /auth/logout      | Invalidate token (blocklist)       |
| GET    | /auth/me          | Get current user                   |

**POST /auth/register**
```json
// Request
{ "email": "user@example.com", "password": "s3cure!" }

// Response 201
{ "id": "uuid", "email": "user@example.com", "created_at": "2026-04-21T..." }
```

**POST /auth/login**
```json
// Request
{ "email": "user@example.com", "password": "s3cure!" }

// Response 200
{ "access_token": "eyJ...", "token_type": "bearer", "expires_in": 604800 }
```

### User Preferences

| Method | Path                   | Description                      |
|--------|------------------------|----------------------------------|
| GET    | /users/me/preferences  | Get current user's preferences   |
| PUT    | /users/me/preferences  | Update preferences (full replace)|

**GET /users/me/preferences — Response 200**
```json
{
  "training_phase": "bulk",
  "daily_calories_kcal": 2600,
  "protein_g": 190,
  "carbs_g": 280,
  "fat_g": 75,
  "dietary_flags": [],
  "allergy_flags": [],
  "weekday_prep_min": 20,
  "weekend_batch_min": 120,
  "openai_api_key_configured": true
}
```

Note: `openai_api_key_configured` is a boolean — the key value is never returned.

**PUT /users/me/preferences**
```json
// Request — all fields optional, omitted fields unchanged
{
  "training_phase": "cut",
  "daily_calories_kcal": 2000,
  "protein_g": 180,
  "carbs_g": 150,
  "fat_g": 65,
  "openai_api_key": "sk-..."
}
```

### Meals

| Method | Path           | Description                              |
|--------|----------------|------------------------------------------|
| GET    | /meals         | List meals (library + user's custom)     |
| GET    | /meals/{id}    | Get a single meal                        |
| POST   | /meals         | Create a custom meal                     |
| PUT    | /meals/{id}    | Update a custom meal (owner only)        |
| DELETE | /meals/{id}    | Delete a custom meal (owner only)        |

**GET /meals — Query params:**
- `source`: `curated` | `custom` | `all` (default: `all`)
- `tags`: comma-separated dietary tags filter (e.g. `vegetarian,gluten-free`)
- `min_protein_g`: integer
- `max_protein_g`: integer
- `min_calories`: integer
- `max_calories`: integer
- `max_prep_min`: integer
- `favorites_only`: boolean
- `limit`: integer (default 50, max 200)
- `offset`: integer (default 0)

**GET /meals — Response 200**
```json
{
  "total": 87,
  "items": [
    {
      "id": "uuid",
      "name": "Grilled Chicken + Rice + Broccoli",
      "calories_kcal": 520,
      "protein_g": 45.0,
      "carbs_g": 52.0,
      "fat_g": 9.5,
      "prep_time_min": 25,
      "tags": [],
      "source": "curated",
      "is_favorite": false
    }
  ]
}
```

**POST /meals (custom meal)**
```json
// Request
{
  "name": "My Protein Oatmeal",
  "calories_kcal": 420,
  "protein_g": 35.0,
  "carbs_g": 48.0,
  "fat_g": 8.0,
  "prep_time_min": 10,
  "ingredients": [
    { "name": "Rolled oats", "quantity": 80, "unit": "g" },
    { "name": "Whey protein", "quantity": 30, "unit": "g" },
    { "name": "Almond milk", "quantity": 240, "unit": "ml" }
  ],
  "prep_notes": "Cook oats in almond milk, stir in protein powder off heat.",
  "tags": ["gluten-free"]
}

// Response 201
{ "id": "uuid", ...full meal object... }
```

### Meal Plans

| Method | Path                               | Description                           |
|--------|------------------------------------|---------------------------------------|
| GET    | /plans                             | List user's plans                     |
| GET    | /plans/current                     | Get or create plan for current week   |
| GET    | /plans/{id}                        | Get plan with all slots populated     |
| POST   | /plans                             | Create a new plan for a given week    |
| PUT    | /plans/{id}/slots                  | Set a single slot (upsert)            |
| DELETE | /plans/{id}/slots/{day}/{slot_type}| Clear a slot                          |
| POST   | /plans/{id}/copy-week              | Copy slots from another week's plan   |
| POST   | /plans/{id}/generate               | AI-generate meal suggestions for plan |

**GET /plans/{id} — Response 200**
```json
{
  "id": "uuid",
  "week_start": "2026-04-21",
  "slots": {
    "0": {
      "breakfast": { "meal_id": "uuid", "meal": { ...meal object... } },
      "lunch":     { "meal_id": "uuid", "meal": { ...meal object... } },
      "dinner":    { "meal_id": "uuid", "meal": { ...meal object... } },
      "snack":     null
    }
  },
  "daily_totals": {
    "0": { "calories_kcal": 1980, "protein_g": 172.0, "carbs_g": 195.0, "fat_g": 58.5 }
  },
  "weekly_totals": { "calories_kcal": 13680, "protein_g": 1190.0, "carbs_g": 1340.0, "fat_g": 410.0 }
}
```

**PUT /plans/{id}/slots**
```json
// Request
{ "day_of_week": 0, "slot_type": "breakfast", "meal_id": "uuid" }

// Response 200
{ "day_of_week": 0, "slot_type": "breakfast", "meal_id": "uuid" }
```

**POST /plans/{id}/copy-week**
```json
// Request
{ "source_plan_id": "uuid" }

// Response 200
{ "slots_copied": 14 }
```

### Shopping List

| Method | Path                        | Description                             |
|--------|-----------------------------|-----------------------------------------|
| POST   | /plans/{id}/shopping-list   | Generate (or regenerate) shopping list  |
| GET    | /plans/{id}/shopping-list   | Get current shopping list               |
| PATCH  | /plans/{id}/shopping-list/items | Update checked state of items        |
| GET    | /shopping-lists/{token}     | Public read-only view via share token   |

**GET /plans/{id}/shopping-list — Response 200**
```json
{
  "id": "uuid",
  "plan_id": "uuid",
  "generated_at": "2026-04-21T...",
  "share_url": "https://app.example.com/list/abc123",
  "categories": [
    {
      "category": "proteins",
      "label": "Proteins",
      "items": [
        { "name": "Chicken breast", "quantity": 2.4, "unit": "lbs", "checked": false },
        { "name": "Greek yogurt (2%)", "quantity": 4.0, "unit": "cups", "checked": false }
      ]
    },
    {
      "category": "produce",
      "label": "Produce",
      "items": [
        { "name": "Broccoli", "quantity": 3.0, "unit": "lbs", "checked": false }
      ]
    }
  ]
}
```

**PATCH /plans/{id}/shopping-list/items**
```json
// Request
{ "updates": [{ "name": "Chicken breast", "checked": true }] }
```

### Feedback

| Method | Path                | Description              |
|--------|---------------------|--------------------------|
| POST   | /meals/{id}/feedback| Submit or update rating  |
| GET    | /meals/{id}/feedback| Get user's own rating    |

**POST /meals/{id}/feedback**
```json
// Request
{ "rating": 4, "plan_id": "uuid", "notes": "Good but a bit bland" }

// Response 201
{ "id": "uuid", "meal_id": "uuid", "rating": 4, "notes": "..." }
```

### Grocery Store Integration (Stub)

| Method | Path             | Description                           |
|--------|------------------|---------------------------------------|
| GET    | /grocery/search  | Search grocery items by name (stubbed)|

See [Integration Stubs](#integration-stubs-grocery-store-api) for stub behavior.

---

## Meal Generation Logic

The `/plans/{id}/generate` endpoint uses OpenAI to suggest meals that fill empty slots in a plan while matching the user's macro targets and preferences.

### When AI Generation Is Available

AI generation requires the user to have configured an OpenAI API key in their preferences. If no key is configured, the endpoint returns `402 Payment Required` with a message directing the user to add their key in settings.

### Prompt Design

**System prompt** (assembled from `user_preferences` at request time):

```
You are a meal planning assistant. Your job is to suggest meals for a fitness-focused person.

User profile:
- Training phase: {training_phase}
- Daily targets: {daily_calories_kcal} kcal | {protein_g}g protein | {carbs_g}g carbs | {fat_g}g fat
- Dietary restrictions: {dietary_flags or "none"}
- Allergies: {allergy_flags or "none"}
- Max weekday prep time: {weekday_prep_min} minutes per meal
- Max weekend prep time: {weekend_batch_min} minutes total

Meal history context:
- Highly rated meals (4-5 stars): {top_rated_meal_names, up to 10}
- Low rated meals (1-2 stars): {low_rated_meal_names, up to 10}

Rules:
1. Each suggested meal must hit approximately the target macros for that slot type
   (breakfast ~25% of daily total, lunch ~30%, dinner ~35%, snack ~10%)
2. Respect all dietary restrictions and avoid all allergens absolutely
3. Prefer meals similar to highly rated history; avoid patterns from low-rated meals
4. Batch-cook friendly: prefer meals that reheat well for lunch/dinner across multiple days
5. Respond with valid JSON only — no prose, no markdown
```

**User turn:**

```
Suggest meals for the following empty slots. Return a JSON array of suggestions.

Empty slots:
{[{ "day_of_week": 0, "slot_type": "lunch" }, ...]}

For each slot, suggest one meal from this library or propose a new simple meal.
Known meal library (id, name, macros):
{compact_meal_library_json}

Response format:
[
  {
    "day_of_week": 0,
    "slot_type": "lunch",
    "meal_id": "uuid-if-from-library-or-null",
    "meal_name": "name",
    "calories_kcal": 520,
    "protein_g": 45.0,
    "carbs_g": 52.0,
    "fat_g": 9.5
  }
]
```

### Response Parsing

The endpoint uses `response_format: { "type": "json_object" }` (OpenAI JSON mode) to guarantee parseable output.

Parsing steps:
1. Parse the JSON response array.
2. For each suggestion, if `meal_id` is non-null and exists in the database, use that meal directly.
3. If `meal_id` is null (AI proposed a new meal), create a transient `Meal` object with the AI-supplied macros and name. The user can optionally save it as a custom meal.
4. Write each suggestion to the corresponding `meal_plan_slots` row.
5. Recalculate `daily_totals` and `weekly_totals` for the plan.

If parsing fails (malformed JSON, missing fields), the endpoint returns `502 Bad Gateway` with an error message and does not modify the plan.

### Feedback Loop

The feedback loop shapes future AI suggestions without requiring ML infrastructure:

1. After a user rates a meal, the rating is stored in the `feedback` table.
2. On the next `/generate` call, the backend queries the user's average ratings per meal and includes top-rated and low-rated meal names in the system prompt (see prompt above).
3. OpenAI is instructed to prefer patterns from liked meals and avoid patterns from disliked meals.

This is a lightweight heuristic, not a trained model. It requires no additional infrastructure in v1.

---

## OpenAI Integration Pattern (BYOK)

### Why BYOK

The product does not bundle an OpenAI API key. Users who want AI-assisted plan generation supply their own key. This eliminates API cost liability for the operator in v1 and sidesteps rate limit management across shared keys.

### Key Storage

User API keys are stored encrypted in `user_preferences.openai_api_key_enc`.

**Encryption scheme:**
- Algorithm: AES-256-GCM
- Encryption key: a server-side secret stored in an environment variable (`OPENAI_KEY_ENCRYPTION_SECRET`, 32-byte random)
- Each stored value includes: `{iv_hex}:{ciphertext_hex}:{auth_tag_hex}` (`:` delimited)
- The plaintext key is never logged or included in any API response

**Validation on save:**
When the user submits a key via `PUT /users/me/preferences`, the backend makes a minimal test call to OpenAI (`GET /models`) before encrypting and saving. If the call fails with 401, the endpoint returns `422` with `"openai_api_key": "Invalid API key"`. This prevents storing bad keys silently.

### Runtime Key Handling

```python
# Pseudocode — backend service layer
def get_openai_client(user_preferences: UserPreferences) -> OpenAI:
    if not user_preferences.openai_api_key_enc:
        raise NoAPIKeyError()
    plaintext_key = decrypt_aes_gcm(
        user_preferences.openai_api_key_enc,
        secret=settings.OPENAI_KEY_ENCRYPTION_SECRET
    )
    return OpenAI(api_key=plaintext_key, timeout=30.0)
```

The key is decrypted in memory for the duration of the API call and not held in any cache or thread-local.

### Error Handling

| OpenAI Error            | HTTP Status Returned | User-Facing Message                                     |
|-------------------------|----------------------|---------------------------------------------------------|
| 401 Unauthorized        | 422                  | "Your OpenAI API key is invalid. Update it in settings."|
| 429 Rate limited        | 429                  | "OpenAI rate limit reached. Try again in a moment."     |
| 500 / 503 OpenAI error  | 502                  | "OpenAI is unavailable. Try again shortly."             |
| Timeout (>30s)          | 504                  | "AI generation timed out. Try again."                   |
| Parse failure           | 502                  | "AI returned an unexpected response. Try again."        |

All errors are logged with `user_id`, `plan_id`, and the OpenAI error code (not the key). The plan is not modified on any error path.

### Model Selection

- Model: `gpt-4o` (default)
- `response_format`: `{ "type": "json_object" }`
- `max_tokens`: 2048
- `temperature`: 0.4 (low randomness — nutritional consistency matters more than variety)

The model is not user-configurable in v1.

---

## Integration Stubs: Grocery Store API

Direct grocery store integration (Instacart, Kroger, Walmart) is out of scope for v1. A stub endpoint and interface are defined so the integration point is clear for future implementation.

### Stub Endpoint

**GET /grocery/search**

Query params: `q` (ingredient name), `store` (optional retailer slug, default `generic`)

**Stub response 200:**
```json
{
  "store": "generic",
  "query": "chicken breast",
  "results": [
    {
      "sku": "stub-001",
      "name": "Boneless Skinless Chicken Breast",
      "price_usd": null,
      "unit": "lbs",
      "available": null,
      "url": null
    }
  ],
  "stub": true
}
```

The `stub: true` field distinguishes stub responses from real integrations. The frontend suppresses price and availability UI when `stub: true`.

### Interface Contract (for future implementation)

A real grocery integration must satisfy this response contract:

```python
class GrocerySearchResult(BaseModel):
    sku: str
    name: str
    price_usd: float | None
    unit: str
    available: bool | None
    url: str | None

class GrocerySearchResponse(BaseModel):
    store: str
    query: str
    results: list[GrocerySearchResult]
    stub: bool = False
```

When a real integration replaces the stub, it implements a `GroceryClient` interface with a `search(query: str) -> GrocerySearchResponse` method. The stub and real implementations both satisfy this interface. No API contract changes are needed in the shopping list generation logic.

### Planned Integration Target (post-v1)

Instacart's Developer Platform API is the primary target for v1+. The stub's `store` field is designed to route requests to store-specific clients in a future `GroceryClientFactory`.

---

## Security Notes

- Passwords: hashed with bcrypt (cost factor 12) before storage
- JWT secrets: stored in environment variables, never in code
- OpenAI keys: AES-256-GCM encrypted at rest (see BYOK section)
- CORS: restricted to the frontend origin in production (`CORS_ALLOWED_ORIGINS` env var)
- SQL: all queries use parameterized statements via SQLAlchemy ORM; no raw string interpolation
- Rate limiting: 100 req/min per IP on auth endpoints; 10 req/min per user on `/generate`
