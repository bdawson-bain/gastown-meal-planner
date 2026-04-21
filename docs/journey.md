# User Journey: Gas Town Meal Planner v1

**Segment:** Fitness-focused singles (see [segmentation.md](segmentation.md))  
**Surface:** Mobile-first responsive web app  
**Primary pattern:** Weekly planning session (Sunday), mid-week check-in

---

## Overview

A fitness-focused single's relationship with the app follows a weekly rhythm: set up once, plan on Sunday, shop and prep that afternoon, check in mid-week if needed. The four flows below map this cycle from first visit through ongoing use.

---

## Flow 1: Onboarding

**Context:** First visit. User has arrived from a fitness community, social link, or search. They understand meal planning but haven't used this tool before.

### Happy Path

1. **Landing page.** User sees the value proposition ("build a macro-compliant meal plan in under 10 minutes") and a single CTA: *Get started*. No signup wall before seeing the product pitch.

2. **Account creation.** Email and password. No OAuth in v1. Email confirmation is sent but not required to proceed—user enters the app immediately.

3. **Setup wizard launches automatically** on first login. A progress indicator shows 4 short steps. User cannot skip it (forced gate—see decision point below).

4. **Step 1 — Training phase.** Three options with brief descriptions:
   - *Cut* — calorie deficit, preserve muscle
   - *Bulk* — calorie surplus, build muscle
   - *Maintenance* — steady weight, performance focus

5. **Step 2 — Macro targets.** Fields for daily calories, protein (g), carbs (g), fat (g). Pre-filled with common defaults based on the selected phase (e.g., cut → 2,000 kcal / 180g protein / 150g carbs / 65g fat). User edits to match their own targets. A helper note reads: *"Bring your own numbers—use your fitness tracker or a TDEE calculator if you need a starting point."*

6. **Step 3 — Dietary preferences and allergies.** Checkboxes for common profiles: none (default), vegetarian, vegan, gluten-free, dairy-free. Separate field for allergy flags (nuts, shellfish, eggs, soy). These filter the meal library—they do not restrict it entirely.

7. **Step 4 — Cooking availability.** Two slider inputs:
   - *Weekday prep time per meal:* 10 / 20 / 30 / 45 min
   - *Weekend batch-cook time:* under 1 hr / 1–2 hrs / 2+ hrs
   These inform default meal suggestions but do not lock the user out of longer recipes.

8. **Profile saved.** User lands on the empty 7-day planner with a brief tooltip: *"Add meals from the library to build your week."*

### Key Decision Points

- **Forced setup gate vs. explore-first.** The wizard is required before accessing the planner. Rationale: macro targets are needed to show meaningful on-target/off-target feedback. A planner with no targets is just a calendar. The tradeoff is higher drop-off at wizard step 2 for users who don't yet know their numbers—addressed by the TDEE helper note and editable defaults.

- **No household size field.** The segment is singles cooking for one. Household size is omitted to reduce wizard length and avoid confusion. Serving-size assumptions in the meal library default to single portions.

### Where Personalization Kicks In

- Macro targets set here drive all on-target indicators throughout the app.
- Dietary flags filter the default meal library view (vegetarian users see a vegetarian-first sort).
- Cooking time slots influence which meals are surfaced as *suggested* in the library (shorter prep meals on weekdays).

---

## Flow 2: Meal Planning

**Context:** Sunday morning. User has 20–30 minutes. Their profile is set up. They open the planner to build the coming week.

### Happy Path

1. **Planner view loads.** A 7-column grid (Mon–Sun), each column containing the configured meal slots (default: breakfast, lunch, dinner, snack). Each cell is empty with a *+ Add meal* tap target.

2. **Macro summary bar** is visible above the grid, showing weekly totals: calories, protein, carbs, fat. All zeros at start. A secondary view shows per-day totals when the user taps a column header.

3. **User taps *+ Add meal* in Monday breakfast.** A bottom sheet opens with the meal library.

4. **Library browsing.** Meals are listed with name, macros, and prep time. Default sort: protein-density (protein per calorie), descending. User can filter by:
   - Prep time (≤20 min, ≤30 min, any)
   - Protein range (slider)
   - Calorie range (slider)
   - Favorites only
   Dietary preferences from onboarding are applied as a persistent default filter; user can override.

5. **User taps a meal.** A detail card shows full macros, ingredients list, and a one-paragraph prep note. Two actions: *Add to slot* and *Add to favorites*.

6. **Meal added to slot.** The cell shows the meal name and its macro contribution. The daily column total and weekly summary bar update immediately.

7. **Color coding activates** as the day fills in:
   - Gray: incomplete (day has empty slots)
   - Green: within ±10% of daily macro targets across all macros
   - Amber: one macro 10–20% off target
   - Red: a macro >20% off target or total calories significantly over

8. **User fills remaining slots.** For lunch and dinner, they repeat the library flow. For the snack slot, they might pick a high-protein option to close a protein gap visible in the daily total.

9. **Day 1 is green.** User wants to replicate it across the week (batch-cook pattern). Long-press on Monday's column header → *Copy to...* → selects Tuesday through Friday. The plan copies. Weekend slots (Sat/Sun) are left for flexible eating or filled separately.

10. **Plan auto-saves** after every change. No explicit save step.

### Key Decision Points

- **Slot flexibility.** v1 uses fixed slots (breakfast, lunch, dinner, snack) rather than user-configurable. This matches the majority of the segment's eating pattern and reduces setup complexity. Users who eat 5–6 smaller meals can use the snack slot as a second lunch.

- **Drag vs. tap to add.** Mobile-first means drag-and-drop is unreliable. Tapping a slot to open the library, then selecting a meal, is the primary interaction. Drag is deferred to a later release for desktop.

- **Partial plans are valid.** The app does not require all slots to be filled. A user who skips breakfast can leave those cells empty without errors. Macro totals reflect only filled slots.

### Where Personalization Kicks In

- On-target indicators are calibrated to the user's specific macro targets, not generic recommendations.
- The library default sort and filter state reflect dietary preferences set in onboarding.
- After several weeks of use, frequently added meals surface in a *Recently used* section at the top of the library (logged client-side in v1, deferred to server in a later version).

---

## Flow 3: Grocery List Generation

**Context:** User has finished building (or partially building) the week's plan. They're ready to shop—either immediately after planning or later the same day.

### Happy Path

1. **User taps *Generate shopping list*** from the planner view (persistent button in the bottom nav or floating action button). The action is available any time the plan has at least one meal added.

2. **Consolidation runs.** The app aggregates all ingredients across every filled meal slot:
   - Identical ingredients are summed (e.g., chicken breast appears in 4 meals → combined into a single line item with total weight).
   - Near-identical ingredients are matched with a simple normalization pass (e.g., "chicken breast, boneless" and "boneless chicken breast" → same item). In v1, this matching is based on a curated ingredient alias table, not ML.

3. **Shopping list view loads.** Items are grouped into four categories:
   - **Proteins** (meat, fish, eggs, tofu)
   - **Produce** (vegetables, fruit)
   - **Dairy & refrigerated** (Greek yogurt, cottage cheese, milk)
   - **Pantry & dry goods** (rice, oats, canned goods, oil, spices)
   Each category is a collapsible section, expanded by default.

4. **Item format.** Each line shows: ingredient name, total quantity, and unit (e.g., *Chicken breast — 2.4 lbs*). Quantities are rounded to practical units (nearest 0.1 lb for meat, nearest cup for dry goods).

5. **User marks items already on hand.** Tapping a line item checks it off (strikethrough). Checked items persist within the session. A *Hide checked* toggle removes them from view.

6. **User exports or copies the list.** Two options:
   - *Copy as text* — plain-text formatted list copied to clipboard.
   - *Share link* — generates a short URL to a read-only text view of the list (no account required to view). Useful for sending to a phone before leaving for the store.

7. **User goes shopping**, using the list on their phone.

### Key Decision Points

- **No store-specific integrations.** Cart submission to Instacart, Walmart, or similar is out of scope for v1. The list is intentionally simple text that works anywhere—including handwriting it.

- **Ingredient normalization scope.** The alias table handles common gym-food staples (chicken breast, ground turkey, oats, rice, Greek yogurt) well. Less common ingredients in custom meals may not consolidate cleanly. Users see a note: *"Check for duplicates if you added custom meals."* A future iteration extends the alias table or applies fuzzy matching.

- **Regenerating after plan changes.** If a user edits the plan after generating a list, they return to the planner and tap *Regenerate list*. The previous list is replaced. There is no diff/incremental update in v1.

### Where Personalization Kicks In

- Items are sorted within each category to surface the proteins that appear most frequently in the user's plan first (implicit "usually need" ordering).
- Users who have flagged allergies see a subtle warning indicator if any ingredient in the list matches an allergy flag (can happen with custom meals or meals the user added despite the filter).

---

## Flow 4: Plan Revision

**Context:** Mid-week (Wednesday) or the following Sunday. User wants to adjust the current plan—because a meal didn't work out, they're bored, a training phase changed, or they're planning ahead for the next week.

### Happy Path (Mid-Week Swap)

1. **User opens the planner.** Completed days (Mon–Tue) appear faded to indicate they're in the past. The current day is highlighted.

2. **User wants to swap Thursday dinner** (they prepped chicken but got tired of it mid-week). Taps Thursday's dinner slot → *Replace meal*.

3. **Library opens** with the current meal pre-selected for reference. User browses alternatives, filtered to similar calorie and protein range (pre-filled from the current meal's values, editable). They pick a different meal.

4. **Swap confirmed.** Macro totals for Thursday and the week update. The replaced meal's ingredients are removed from the shopping list for the current week (or user is prompted: *"Regenerate your list?"*).

### Happy Path (Phase Change)

1. **User is transitioning from a bulk to a cut.** They open their profile (settings icon → *Nutrition targets*). They update daily calorie goal and macro targets for the cut phase.

2. **On returning to the planner,** a banner appears: *"Your targets changed. Some days are now showing over target — review and adjust?"*

3. **Off-target days are re-flagged** with amber/red indicators based on the new targets. Days that were green under bulk targets may now be over-calorie for a cut.

4. **User works through the flagged days**, swapping high-calorie dinners for lighter options, reducing serving sizes, or replacing a high-carb meal with a protein-forward one.

5. **All days return to green.** User regenerates the shopping list for the updated plan.

### Happy Path (Next Week's Plan)

1. **On Sunday,** user opens the planner. They see the previous week still populated.

2. **They tap *New week*.** A modal offers two options:
   - *Start fresh* — clears all slots.
   - *Copy from last week* — pre-fills all slots with last week's meals (common for batch-cookers who repeat the same plan when it worked).

3. **If copying,** user reviews and makes targeted swaps (replace one or two meals to avoid monotony), then generates a new shopping list.

### Key Decision Points

- **Past-day edit behavior.** In v1, past days are visually faded but still editable. The app does not prevent editing historical slots because users sometimes log meals retroactively or adjust a plan after the fact. No tracking or logging functionality is added—the edit is purely planning.

- **No automatic meal suggestions on swap.** When a user taps *Replace meal*, they see the standard library—not an AI-generated recommendation. Automated suggestions are out of scope for v1. The *Similar macros* filter pre-fill is the extent of "smart" assistance here.

- **Target change doesn't auto-adjust the plan.** When macro targets change, the app flags days that are now off-target but does not automatically replace meals. Automatic plan modification would feel presumptuous and could discard meals the user intentionally chose. The user makes the adjustments.

### Where Personalization Kicks In

- **Favorites and recent use.** Meals the user has added repeatedly surface at the top of the library when revising. Over time, the *Recently used* list reflects their actual rotation—reducing browse friction.
- **Phase-aware defaults.** When the user edits their targets after a phase change, the macro field defaults update to common values for the newly selected phase, reducing input effort.
- **Plan memory.** The *Copy from last week* flow means a user who found a good plan can reuse it with minimal effort—a natural flywheel where the app becomes faster to use the longer they stick with it.

---

## Cross-Cutting Notes

**Mobile-first interaction model.** Taps, bottom sheets, and swipe-to-dismiss replace hover states and drag targets. The 7-day grid scrolls horizontally on smaller screens; each day column is the primary interaction target.

**No notifications in v1.** The app does not send push notifications or email reminders. The user's Sunday planning habit is self-driven. Notification hooks are a future retention lever once the core planning loop is validated.

**Offline behavior.** The app requires connectivity for account sync and library data. Local draft state (unsaved plan edits) is preserved in browser storage and synced on reconnect. No explicit offline mode is built for v1.

**Data persistence.** All plan state, custom meals, favorites, and macro targets are tied to the user's account and persist across devices and browser sessions.
