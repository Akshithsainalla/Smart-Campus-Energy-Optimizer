# ⚡ SCEO — Smart Campus Energy Optimizer

> A full-stack web application for monitoring, analyzing, and visualizing campus-wide energy consumption in real time — built with React + Spring Boot.

![SCEO Dashboard](frontend/src/assets/react.svg)

---

## �️ Screenshots

| Login Page | Dashboard |
|-----------|-----------|
| Glassmorphism card, animated icon, gradient title | Sidebar nav, stat cards, chart, building breakdown |

---

## �🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 7, React Router 7, Chart.js 4 |
| **Backend** | Spring Boot 3.2.5, Spring Security, Spring Data JPA |
| **Database** | MySQL (Aiven Cloud) |
| **Styling** | CSS3 — Glassmorphism, Dark Mode, Animations |
| **HTTP Client** | Axios |

---

## 📁 Project Structure

```
SCEO/
├── README.md
├── frontend/                        # React/Vite SPA
│   └── src/
│       ├── App.jsx                  # Routes (/ and /dashboard)
│       ├── main.jsx                 # Entry point + BrowserRouter
│       ├── index.css                # Global dark-mode design system
│       ├── login.jsx                # Login page (glassmorphism UI)
│       ├── dashboard.jsx            # Dashboard (sidebar + views + modal)
│       └── energychart.jsx          # Chart.js line chart component
│
└── backend/                         # Spring Boot REST API
    └── src/main/java/jar/
        ├── DemoApplication.java
        ├── config/
        │   └── SecurityConfig.java  # CORS + Security rules
        ├── controller/
        │   ├── AuthController.java  # POST /api/auth/login & /register
        │   └── EnergyController.java# GET & POST /api/energy
        ├── model/
        │   ├── User.java
        │   └── EnergyUsage.java
        └── repository/
            ├── UserRepository.java
            └── EnergyUsageRepository.java
```

---

## ⚙️ Getting Started

### Prerequisites
- Java 17+
- Node.js 18+
- MySQL database (Aiven Cloud already configured)

### 1. Start the Backend

```bash
cd backend

# Windows
.\mvnw.cmd spring-boot:run

# Mac / Linux
./mvnw spring-boot:run
```

✅ Backend starts at **http://localhost:8080**

### 2. Start the Frontend

```bash
cd frontend
npm install
npm run dev
```

✅ Frontend starts at **http://localhost:5173**

---

## 🔌 REST API Reference

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| `POST` | `/api/auth/login` | Login with credentials | `{ email, password }` |
| `POST` | `/api/auth/register` | Register new user | `{ email, password, role }` |
| `GET` | `/api/energy` | Get all energy records | — |
| `POST` | `/api/energy` | Add new energy record | `{ building, consumption, usageDate }` |

---

## 🗄️ Database Schema

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT | Auto PK |
| email | VARCHAR | Unique |
| password | VARCHAR | Plain text (use BCrypt in production) |
| role | VARCHAR | `USER` or `ADMIN` |

### `energy_usage`
| Column | Type | Notes |
|--------|------|-------|
| id | BIGINT | Auto PK |
| building | VARCHAR | e.g. `Library`, `Admin Block` |
| consumption | DOUBLE | Energy in kWh |
| usage_date | DATE | Date of the reading |

---

## 🎨 UI Features

### Login Page
- 🌌 Glassmorphism card with backdrop blur
- ✨ Animated floating energy icon
- 🎨 Gradient title (SCEO)
- ⚠️ Inline error messages
- ⏳ Loading state on submit
- ⌨️ Enter key to login

### Dashboard
- 🗂️ **Sidebar navigation** — Overview, Buildings, Records
- 📊 **4 Stat Cards** — Total kWh, Peak Usage, Avg/Day, Active Buildings
- 📉 **Trend Chart** — Gradient area chart sorted by date
- 🏛️ **Buildings View** — Bar breakdown by building with percentages
- 📋 **Records Table** — Sortable full records list
- ➕ **Add Record Modal** — Form with building, kWh, and date
- 🔔 **Toast Notifications** — Success/error feedback
- 👤 **User info + Logout** in sidebar footer

---

## 🔐 Security

- Spring Security configured to **permit all `/api/**`** routes
- CORS enabled for `http://localhost:5173`
- `spring.jpa.hibernate.ddl-auto=update` — auto-creates tables on first run

> ⚠️ **Before production:** hash passwords with BCrypt and restrict CORS origins.

---

## 🧪 Running Tests

```bash
cd backend
.\mvnw.cmd test
```

---

## 🔜 Planned Features

- [ ] BCrypt password hashing
- [ ] JWT authentication tokens
- [ ] Role-based access (Admin / User)
- [ ] PDF / CSV export of energy reports
- [ ] Real-time WebSocket updates
- [ ] Dark/Light theme toggle

---

## 👨‍💻 Author

**Akshith Sai Nalla** — SCEO Project, 2026
