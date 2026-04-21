# Measurement Plan: Gas Town Meal Planner v1

**Date:** 2026-04-21  
**Segment:** Fitness-focused singles (see [segmentation.md](segmentation.md))

---

## Purpose

This document defines what we measure, how we measure it, and—critically—what we
refuse to optimize for. Metrics exist to answer one question: **are users getting the
core value?** For this product, core value is a complete, macro-compliant weekly plan
that produces a usable grocery list, repeated weekly.

---

## Primary Success Metrics

These directly track whether users are achieving the product's stated value proposition.

### 1. Plan Completion Rate

**Definition:** % of active planning sessions where the user fills all meal slots for
at least 5 of 7 days before closing the planner.

**Why it matters:** The PRD's primary job-to-be-done is "a complete 7-day meal plan
that hits my macro targets." Partial plans may be acceptable mid-session but a session
that ends with <5 days filled means the user didn't finish the job. 5/7 days is the
threshold because batch-cookers commonly leave weekends flexible.

**Target:** >60% of planning sessions result in a 5+ day plan at 4 weeks post-launch.

---

### 2. Grocery List Generation Rate

**Definition:** % of 5+-day plans that result in the user tapping *Generate shopping list*.

**Why it matters:** The grocery list is the completion artifact. A user who builds a
plan but never generates the list either didn't get to the shopping step or lost the
thread. Plan completion without list generation is an incomplete job.

**Target:** >75% of completed plans (5+ days filled) result in a shopping list being
generated.

---

### 3. Week-2 Retention

**Definition:** % of users who return and create or open a plan in week 2 (days 8–14
after registration).

**Why it matters:** The product's value is in the weekly rhythm: plan, shop, prep,
repeat. A user who doesn't return week 2 didn't form the habit. Week-2 retention is
the earliest signal that the flywheel is working.

**Target:** >40% week-2 retention at 8 weeks post-launch.

---

### 4. Month-1 Retention

**Definition:** % of users who return and plan in at least 2 of weeks 2–4 after
registration.

**Why it matters:** Week-2 retention catches early adopters; month-1 retention catches
sustained habit formation. "At least 2 of weeks 2–4" (not 3 of 3) accounts for life
interruptions while still requiring pattern use.

**Target:** >25% month-1 retention at 12 weeks post-launch.

---

### 5. Plans Created per Active User per Month

**Definition:** Among users who opened the planner at least once in a 28-day window,
the average number of plans initiated (any new week started).

**Why it matters:** Depth of use. One plan per month = user tried it but didn't commit.
Four plans per month = the Sunday planning habit is established.

**Target:** >3.5 plans/month for users active in months 2+.

---

## Leading Indicators

These are early-session signals that predict whether a user will reach primary success
metrics. They inform onboarding quality and time-to-value.

### 1. Onboarding Completion Rate

**Definition:** % of registered users who complete all 4 steps of the setup wizard
(training phase → macro targets → dietary preferences → cooking availability).

**Why it matters:** Onboarding is a forced gate before the planner is accessible. A
user who abandons the wizard cannot use the product. Low completion rate here is a
product-level blocker, not a retention problem.

**Track by step:** Each wizard step is a separate event so we can identify where
drop-off concentrates. Hypothesis: step 2 (macro targets) has the highest drop-off
because users who don't know their numbers are likely to bail here.

---

### 2. Time to First Meal Added

**Definition:** Median elapsed time from onboarding completion to first `meal_added`
event, in minutes.

**Why it matters:** Shorter time-to-first-meal means the planner is intuitive and
users don't stall at the blank state. A long median (>15 min) suggests the library
discovery or slot interaction has friction.

---

### 3. First Day Completion Rate

**Definition:** % of users who, in their first planning session, fill all slots for
at least one full day.

**Why it matters:** Completing a single day gives the user the macro feedback loop
(green/amber/red indicators), which is the product's differentiating UX. Users who
never complete one day never experience what makes this product useful.

---

### 4. First Shopping List Rate

**Definition:** % of users who generate a shopping list within their first 2 planning
sessions.

**Why it matters:** The shopping list converts a planning exercise into a tangible
output. Early adoption of the list feature predicts higher engagement and retention.

---

## Personalization Signal Metrics

These track whether the personalization layer—macro targets, dietary preferences,
favorites, recently used—is functioning as an engagement driver and plan quality
signal.

### 1. Meal Swap Rate

**Definition:** % of meal slots that are changed at least once after initial
assignment, within the same planning session.

**Interpretation guide:**
- Low (<10%): Users accept their first picks without adjustment. Could mean good
  library or low engagement.
- Moderate (10–30%): Healthy iteration — users are refining plans.
- High (>40%): Library surfacing may be poor, or users are struggling to hit targets
  on the first attempt. Investigate in combination with day completion rate.

---

### 2. Day Copy Rate

**Definition:** % of planning sessions that include at least one *Copy day to...* action.

**Why it matters:** Day copying is the batch-cook signal. The primary persona
(Disciplined Trainer) explicitly plans a repeating meal rotation. If this feature is
rarely used, either the copy UX is buried or the segment assumption is wrong.

---

### 3. Library Filter Usage Rate

**Definition:** % of library opens that include at least one filter action (prep time,
protein range, calorie range, or favorites-only).

**Why it matters:** If users never filter, they're either browsing raw (fine early on)
or don't understand that filters exist (UX problem). Filter usage also signals that
personalization preferences set in onboarding are influencing browse behavior.

---

### 4. Favorites Adoption Rate

**Definition:** % of active users (WAU) who have at least one favorited meal and have
used a favorited meal in their current week's plan.

**Why it matters:** Favorites are the primary in-product personalization signal — they
let users short-circuit the library browse. Low favorites adoption after week 4 means
users aren't building a personal rotation, which limits the flywheel value of plan
copying.

---

### 5. Copy-from-Last-Week Rate

**Definition:** % of new-week sessions where the user chooses *Copy from last week*
rather than *Start fresh*.

**Why it matters:** Copy-from-last-week is the plan flywheel in action — the product
becoming faster to use over time. Rising copy rate over the first 8 weeks indicates
that users are finding a plan they trust and sticking with it. This metric should
increase monotonically as users settle into a rotation.

---

### 6. Phase Change Rate

**Definition:** % of active users who update their training phase or macro targets at
least once in a given 4-week period.

**Why it matters:** Phase changes (cut → bulk → maintenance) are the lifecycle signal
that users are using this tool as part of an ongoing fitness system, not a one-time
experiment. A phase change is a strong leading indicator of long-term retention.

---

## Instrumentation

### Events to Log

All events are client-side unless noted. Events include a common envelope:
`user_id`, `session_id`, `timestamp`, `platform` (web).

#### Onboarding

| Event | Properties |
|-------|------------|
| `onboarding_started` | — |
| `onboarding_step_completed` | `step` (1–4), `time_on_step_seconds` |
| `onboarding_completed` | `total_time_seconds` |
| `onboarding_abandoned` | `step_abandoned` |

#### Planning

| Event | Properties |
|-------|------------|
| `planner_opened` | `week_offset` (0=current week, -1=prior, etc.) |
| `meal_added` | `meal_id`, `day`, `slot` (breakfast/lunch/dinner/snack) |
| `meal_removed` | `meal_id`, `day`, `slot` |
| `meal_swapped` | `old_meal_id`, `new_meal_id`, `day`, `slot` |
| `day_copied` | `source_day`, `target_days[]` |
| `new_week_started` | `mode` (fresh \| copy_last_week) |
| `plan_autosaved` | — (server-side, on every mutation) |

#### Library

| Event | Properties |
|-------|------------|
| `library_opened` | `source_slot`, `source_day` |
| `library_filter_applied` | `filter_type` (prep_time \| protein \| calories \| favorites), `value` |
| `meal_detail_viewed` | `meal_id` |
| `meal_favorited` | `meal_id` |
| `meal_unfavorited` | `meal_id` |

#### Shopping List

| Event | Properties |
|-------|------------|
| `shopping_list_generated` | `plan_days_filled`, `total_items` |
| `shopping_list_item_checked` | `item_id`, `category` |
| `shopping_list_exported` | `export_type` (text \| link) |
| `shopping_list_regenerated` | — |

#### Profile & Targets

| Event | Properties |
|-------|------------|
| `targets_updated` | `calories_delta`, `protein_delta` (signed integers) |
| `phase_changed` | `from_phase`, `to_phase` |

#### Macro Achievement (computed, not raw events)

Rather than logging every macro-total update, compute daily macro achievement server-side
from the plan state at end-of-day (midnight in user's timezone). Store:

- `day_within_target`: boolean per macro (calories, protein, carbs, fat) using ±10% threshold
- `day_macro_summary`: calories / protein / carbs / fat totals and targets

This gives us plan quality signals without a firehose of real-time update events.

### Where Metrics Live

| Metric type | Storage | Computed by |
|-------------|---------|-------------|
| Raw events | Append-only event table (server-side ingest) | Client SDK → API |
| Session summaries | Derived table, materialized daily | ETL job |
| Retention cohorts | Cohort table (user, signup_week, active_weeks[]) | Weekly batch |
| Plan quality snapshots | Per-week plan summary per user | End-of-week batch |

In v1, a lightweight analytics stack (e.g., PostHog or a simple Postgres + dbt setup)
is sufficient. No real-time dashboards required at launch; weekly batch reports cover
the decision cadence.

---

## Anti-Metrics

These are metrics that can appear healthy while the product erodes. **Do not optimize
for them.**

### 1. Daily Active Users (DAU)

The product is designed for **weekly** use. A Sunday planning session is the entire
use pattern. High DAU likely signals confusion ("I keep coming back because I can't
remember what I planned") or anxiety-checking, not productive engagement. Track WAU.
Optimizing for DAU would push us toward daily prompts, notifications, and features
designed to create daily touchpoints — all misaligned with the batch-planning UX.

---

### 2. Total Meals in Library Favorited per User

More favorites isn't better. A user who favorites 40 meals has a noisy list that
reduces the friction-reduction value of the favorites feature. Quality of plan (macro
targets met) matters, not library collection depth.

---

### 3. Time Spent in App per Session

The value proposition is explicitly **speed**: "build a macro-compliant meal plan in
under 10 minutes." A longer average session time means either the product is harder to
use than expected or users are browsing aimlessly. Optimizing for session time length
would incentivize adding friction and complexity. Target session duration is 10–20
minutes.

---

### 4. Raw Meal Adds per Plan

More meals per plan could reflect a deeply filled plan — or it could reflect swapping
and re-adding meals repeatedly, generating lots of `meal_added` events without actually
completing a plan. Use plan completion rate (5+ days filled) as the quality metric, not
raw meal add count.

---

### 5. Shopping List Exports

A list export (text copy or share link) is a proxy for "user went shopping" but it's
a weak one. Users may export and never shop; users may shop without exporting (some
people just read off the screen). Optimizing for export count would push us toward
making the export feel required or prominent in ways that don't add value. The real
signal is week-2 retention, not export count.

---

### 6. Account Registrations

Registration measures marketing funnel performance, not product value delivery. A surge
in registrations from a campaign that brings low-fit users inflates registration while
dragging down plan completion and retention. Track registrations separately from
activation metrics; never conflate the two.

---

## Metric Summary Table

| Metric | Type | Threshold | Cadence |
|--------|------|-----------|---------|
| Plan completion rate | Primary | >60% by week 4 | Weekly |
| Grocery list generation rate | Primary | >75% of completed plans | Weekly |
| Week-2 retention | Primary | >40% | 8-week cohort |
| Month-1 retention | Primary | >25% | 12-week cohort |
| Plans/active user/month | Primary | >3.5 in month 2+ | Monthly |
| Onboarding completion rate | Leading | >80% | Weekly |
| Time to first meal added | Leading | Median <10 min | Weekly |
| First day completion rate | Leading | >50% | Weekly |
| First shopping list rate | Leading | >55% within 2 sessions | Weekly |
| Meal swap rate | Personalization | 10–30% healthy range | Weekly |
| Day copy rate | Personalization | Rising trend weeks 1–8 | Weekly |
| Library filter usage rate | Personalization | >40% of library opens | Weekly |
| Favorites adoption rate | Personalization | >30% of WAU by week 8 | Weekly |
| Copy-from-last-week rate | Personalization | Rising trend weeks 1–12 | Weekly |
| Phase change rate | Personalization | >10% of actives per 4-week period | Monthly |
