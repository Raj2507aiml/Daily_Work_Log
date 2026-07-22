# Daily Work Log

Premium productivity web app for tracking daily tasks and progress — HTML, CSS, and vanilla JavaScript. Data and auth use LocalStorage only.

## Quick start

```bash
cd Daily_work_log
python -m http.server 5500
```
Live server **https://raj2507aiml.github.io/Daily_Work_Log/**

Open **http://localhost:5500/login.html**

1. Register an account  
2. You’re taken to the dashboard  
3. Tasks, calendar, and analytics are scoped to your user  

## What’s included

- **Auth** — register, login, logout, session remember, per-user tasks  
- **Dashboard** — all stats computed from tasks (live updates, Chart.js weekly overview)  
- **Tasks** — CRUD, notes, search/filter/sort, drag & drop, FAB, shortcuts (`N`, `/`)  
- **Calendar** — month view with indicators  
- **Analytics** — Chart.js (status, weekly, monthly, categories)  
- **Profile** — edit profile, dark/light theme, reset data, logout  

## Structure

```
├── login.html / register.html
├── dashboard.html / index.html / calendar.html / analytics.html / profile.html
├── css/   style · components · dashboard · animations · responsive
└── js/    auth · storage · theme · app · dashboard · calendar · analytics
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `N` | New task |
| `/` or `Ctrl/Cmd + K` | Focus search (Tasks) |
| `Esc` | Close modal |

## Notes

- Each user’s tasks are stored under scoped LocalStorage keys.  
- Theme preference is global on the device.  
- Passwords are hashed for demo purposes (not production-grade security).  
