# Problem Statement

## Main Functionality

FridgeAI is a recipe generation app where users input the ingredients they currently have at home and receive personalised recipe suggestions. Users can manage their ingredient inventory with expiry dates, set allergies and a diet focus, and save favourite recipes for later.

---

## Intended Users

Everyday home cooks — especially students and busy individuals — who want to reduce food waste and avoid the daily question of "what should I cook today?"

---

## GenAI Integration

The GenAI component is the core of the app. Rather than matching ingredients to a fixed recipe database, it dynamically generates recipes based on the user's available ingredients, expiry priorities, and dietary restrictions. It supports both cloud-based (OpenAI API) and local (GPT4All / LLaMA) models, and runs as an independent Python microservice.

---

## Scenarios

**Scenario 1 — Pantry Clearance**
A user has chicken, rice, and garlic expiring soon. FridgeAI prioritises those ingredients and suggests a garlic chicken rice dish with step-by-step instructions.

**Scenario 2 — Allergy-Safe Cooking**
A user with a nut allergy sets it in their profile. Every generated recipe automatically excludes nuts — no manual checking required.

**Scenario 3 — New User**
A student adds eggs, cheese, and leftover pasta to their inventory. FridgeAI generates two recipes, and they save their favourite to revisit later.

**Scenario 4 — Expiry Alerts**
The app highlights ingredients close to expiry on the dashboard and prioritises them when generating the next recipe suggestion.

**Scenario 5 — Diet Focus**
A user sets their diet focus in their preferences (e.g. protein-focused, carb-focused, fat-focused, or veggie-focused). FridgeAI adjusts its recipe suggestions accordingly, leaning on ingredients from their inventory that match the chosen focus — for example, prioritising eggs, chicken, or legumes when the focus is protein, or vegetables and legumes when the focus is veggie.
