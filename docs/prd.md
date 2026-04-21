# Product Requirements Document: Gas Town Meal Planner v1

**Status:** Draft  
**Date:** 2026-04-21  
**Segment:** Fitness-focused singles (see [docs/segmentation.md](segmentation.md))

---

## Overview & Problem Statement

Fitness-focused singles treat nutrition as part of their fitness system. Hitting weekly macro targets, maintaining calorie discipline across a training cycle, and reducing the daily cognitive overhead of "what do I eat today" are real, recurring problems for this segment.

Existing tools fail them in one of three ways:

1. **Generic calorie counters** (MyFitnessPal, Cronometer) track what you ate — they don't help you plan what you will eat. Logging is reactive; planning is proactive.
2. **Meal kit services** (HelloFresh, Factor) handle procurement but eliminate autonomy. Fitness-focused singles have specific macro requirements that prepackaged kits rarely match.
3. **General meal planning apps** are designed for families or casual users. They optimize for variety and ease, not for hitting 180g protein and 2,400 kcal on a cut.

**The gap:** No lightweight tool helps a fitness-focused single build a weekly meal plan that reliably hits macro targets, generates a shopping list, and supports batch-cook prep — without assuming they have a family to feed or a dietitian on call.

Gas Town Meal Planner v1 fills that gap.

---

## Target Personas

Based on the segment decision in `docs/segmentation.md`.

### Primary Persona: The Disciplined Trainer

- **Profile:** 26-year-old living alone, lifting 4x/week, currently on a lean bulk. Tracks macros religiously. Batch-cooks on Sundays. Already uses a fitness tracker and calorie log.
- **Frustration:** Building a weekly plan that hits exactly 190g protein / 2,600 kcal requires manually assembling meals and cross-checking totals. It takes 30–45 minutes every week and still produces mistakes.
- **Goal:** A tool that assembles a macro-compliant weekly plan in under 10 minutes and tells him exactly what to buy.

### Secondary Persona: The Health-Optimizer

- **Profile:** 33-year-old running half-marathons. Not deep into bodybuilding macros, but actively manages carb timing, protein minimums, and calorie balance for performance. Cooks most meals at home.
- **Frustration:** Doesn't want a complex macro-spreadsheet experience — wants guardrails without micromanagement.
- **Goal:** A planner that makes it easy to stay in range without obsessing over every gram.

---

## Jobs-to-be-Done

| Job | Context | Outcome |
|-----|---------|---------|
| Plan my week's meals | Sunday morning, 20–30 min to spend | A complete 7-day meal plan that hits my macro targets |
| Know what to buy | After planning, before shopping | A clean, consolidated shopping list with quantities |
| Prep efficiently | Sunday afternoon batch cook | Clear visibility into what to cook and how much |
| Stay on track mid-week | Quick weeknight check-in | Confidence that I'm on pace without re-doing the math |
| Adjust for phase changes | Starting a cut / bulk / maintenance cycle | Update calorie and macro targets and have the plan adapt |

---

## Core Features / Requirements for v1

### 1. User Profile & Macro Targets

- User sets daily calorie goal, protein/carb/fat targets (in grams)
- Supports three training phases: cut, bulk, maintenance (user-selected)
- Optional: body weight input for reference (not used for auto-calculation in v1)

**Acceptance criteria:**
- User can save and update macro targets
- Targets persist across sessions

### 2. Meal Library

- Curated library of 50–100 common fitness meals (e.g., grilled chicken + rice + broccoli, oat and protein powder bowl, ground turkey pasta)
- Each meal entry includes: name, ingredients, calories, protein, carbs, fat, approximate prep time
- User can mark meals as favorites
- User can add custom meals with manual macro entry

**Acceptance criteria:**
- Library is browsable and filterable by protein range, calorie range
- Custom meals persist to user account
- Nutritional data is displayed clearly at the meal level

### 3. Weekly Meal Planner

- 7-day grid view (Mon–Sun) with configurable meal slots (breakfast, lunch, dinner, optional snack)
- User drags or selects meals from library into slots
- Running daily and weekly macro totals update in real time as meals are added
- Visual indicator when a day is within target range vs. over/under
- Ability to copy a day's plan to another day (batch-cook reuse pattern)

**Acceptance criteria:**
- Daily macro totals are visible for each column
- Weekly aggregate totals are visible
- Over/under indicators are legible at a glance
- Plan is saved automatically

### 4. Shopping List Generator

- One-click generation of a shopping list from the active week's plan
- Ingredients are consolidated across meals (e.g., "chicken breast: 2.4 lbs" not six separate entries)
- Items are grouped by grocery category (produce, protein, pantry, dairy)
- User can mark items as already-have to remove from list
- List is exportable as plain text or shareable via URL

**Acceptance criteria:**
- Ingredient consolidation works correctly across repeated meals
- Category grouping covers at least: produce, meat/seafood, dairy/eggs, pantry/dry goods
- Checked-off items persist within the session

### 5. Auth & Basic Account

- Email/password account creation and login
- Session persistence (stay logged in)
- Data tied to account (plan, custom meals, targets, favorites)

**Acceptance criteria:**
- New user can register and log in
- User data persists across browser sessions

---

## Success Metrics

### Activation

- % of new users who complete a 7-day plan in their first session
- % of new users who generate a shopping list

### Engagement

- Weekly Active Users (WAU) — users who open a plan at least once in 7 days
- Plans created per active user per month
- Average meals added per plan (proxy for depth of use)

### Retention

- Week-2 retention: % of users who return and create a new plan in the second week
- Month-1 retention

### Business (post-launch)

- Conversion rate from free to paid (if freemium tier introduced)
- NPS score from in-app survey at day 30

---

## Non-Goals / Out of Scope for v1

The following are explicitly excluded from v1. Each is a real candidate for future versions, but including them now adds complexity that delays shipping and dilutes focus on the core use case.

| Out of Scope | Rationale |
|-------------|-----------|
| Native iOS / Android apps | Web-first is sufficient for Sunday planning sessions; native adds 4–6 weeks of build time |
| Live grocery store integrations | API partnerships and SKU normalization are non-trivial; plain shopping list solves the core job |
| Social / sharing features | Fitness communities share verbally; social layer adds moderation and infrastructure complexity |
| Multi-person / family planning | Segment decision: fitness-focused singles only. Family coordination is a distinct product problem |
| Automated macro calculations from body metrics | TDEE calculations vary by methodology; v1 trusts users to bring their own targets |
| AI-generated meal suggestions | Useful, but requires recommendation infrastructure; out of scope until library and planning core are validated |
| Barcode scanning / photo logging | Reactive logging, not planning; different product surface |
| Restaurant / food delivery integration | Conflicts with the batch-cook, home-cook pattern of the target segment |
| Subscription / payment system | Free for v1; monetization deferred until retention baseline is established |

---

## Open Decisions

The following questions are unresolved as of v1 scope. Decisions made during development should be documented in `docs/decisions/`.

1. **Serving size unit standard:** Should the meal library use grams, ounces, or support both? Fitness users in the US often use oz/lb but macro calculations are cleaner in grams.

2. **Macro rounding convention:** How precise should displayed macro values be? Whole grams only, or one decimal place? Affects display density.

3. **Custom meal data source:** For custom meals added by users, do we allow free-form ingredient entry, or only meal-level macro totals (simpler)? Ingredient-level entry enables future shopping list integration for custom meals.

4. **Plan versioning:** Can a user have multiple saved weekly plans (e.g., "bulk template," "cut template"), or is there one active plan per week? Multiple templates increase complexity but match how disciplined trainers actually work.

5. **Onboarding flow:** Does the app require macro target setup before showing the planner, or can users explore first? A forced setup gate improves activation-to-use funnel clarity but may increase drop-off.

6. **Meal slot flexibility:** Fixed four slots (B/L/D/S) vs. user-configurable slots (some users eat 5–6 smaller meals). Fixed is simpler; configurable better matches the segment's variety of eating patterns.

---

## Assumptions

- **Users bring their own macro targets.** The product does not calculate TDEE, BMR, or recommended intake from body metrics in v1. Users already know (or can quickly look up) their goals.
- **Web browser is the primary surface.** The planning session is 20–30 minutes, done weekly, typically on a desktop or tablet. A responsive web app serves this well without native app investment.
- **Batch cooking is the dominant prep pattern.** Sunday prep for the week ahead is the primary use case. The planner is built around a 7-day view, not a daily reactive view.
- **The meal library ships curated.** A pre-seeded library of 50–100 high-quality fitness meals reduces the blank-slate problem and demonstrates product value before users add custom meals.
- **No integration with existing tracking apps in v1.** Users who also use MyFitnessPal, Cronometer, or similar tools will tolerate managing two tools. Integration (import targets, sync meals) is a future opportunity.
- **English-only, single currency (USD) for v1.** Localization and multi-currency are deferred.
