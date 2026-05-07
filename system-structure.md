# Initial System Structure

## Tech Stack Overview

| Layer | Technology |
|---|---|
| Client | React |
| Server | Spring Boot (Java) — 3 microservices |
| GenAI Service | Python + LangChain |
| Database | PostgreSQL |
| Auth | JWT issued by User Service, validated by other services |
| Communication | REST between all services |

---

## Services Breakdown

### User Service
Handles registration, login, and user preferences (allergies, preferences). Issues a JWT on successful login that is used by all other services to authenticate requests.

### Inventory Service
Manages the user's ingredient inventory — adding, updating, and removing ingredients along with quantities, units, and expiry dates. Exposes an endpoint for the Recipe Service to fetch a user's current ingredients.

### Recipe Service
The core service. Receives a recipe generation request from the client, fetches the user's ingredients from the Inventory Service and preferences from the User Service, then calls the GenAI Service to generate a recipe. Also handles saving and retrieving favourite recipes.

### GenAI Service (Python / LangChain)
An independent Python microservice that receives a structured prompt (ingredients + preferences) and returns a generated recipe.

---

## Analysis Object Model

```mermaid
classDiagram
    class User {
        +Long id
        +String email
        +String passwordHash
        +LocalDateTime createdAt
    }
    class Preference {
        +Long id
        +List~String~ allergies
    }
    class Ingredient {
        +Long id
        +String name
        +Double quantity
        +String unit
        +LocalDate expiryDate
    }
    class Inventory {
        +Long id
        +Long userId
    }
    class Recipe {
        +Long id
        +String title
        +String instructions
        +Integer prepTimeMinutes
        +String nutritionInfo
    }
    class RecipeIngredient {
        +String name
        +String amount
    }
    class Favourite {
        +Long id
        +Long userId
        +LocalDateTime savedAt
    }

    User "1" --> "1" Preference : has
    User "1" --> "1" Inventory : owns
    Inventory "1" --> "*" Ingredient : contains
    Recipe "1" --> "*" RecipeIngredient : includes
    User "1" --> "*" Favourite : saves
    Favourite "*" --> "1" Recipe : references
```

---

## Use Case Diagram

```mermaid
flowchart LR
    U((User))
    G((GenAI Service))

    subgraph FridgeAI System
        UC1[Register / Login]
        UC2[Manage Inventory]
        UC3[Set Preferences]
        UC4[Generate Recipe]
        UC5[View and Save Recipe]
        UC6[View Favourites]
    end

    U --> UC1
    U --> UC2
    U --> UC3
    U --> UC4
    U --> UC5
    U --> UC6
    UC4 --> G
```

---

## Top-Level Architecture (Component Diagram)

```mermaid
graph TD
    Client[React Frontend]

    subgraph Spring Boot Microservices
        US[User Service]
        IS[Inventory Service]
        RS[Recipe Service]
    end

    GenAI[GenAI Service\nPython / LangChain]

    subgraph PostgreSQL
        UDB[(user schema)]
        IDB[(inventory schema)]
        RDB[(recipe schema)]
    end

    Client -- REST + JWT --> US
    Client -- REST + JWT --> IS
    Client -- REST + JWT --> RS
    RS -- REST --> IS
    RS -- REST --> US
    RS -- REST --> GenAI
    US --- UDB
    IS --- IDB
    RS --- RDB
```

