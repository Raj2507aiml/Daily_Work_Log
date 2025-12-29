# Daily Work Log

A simple web application for logging daily work tasks and hours.

## Features

- Add work tasks with hours spent
- View all logged work entries sorted by date
- Clean, responsive UI
- SQLite database for data storage

## Project Structure

```
Daily_work_log/
├── backend/
│   ├── db.js          # Database connection and setup
│   ├── package.json   # Backend dependencies
│   └── server.js      # Express server with API endpoints
└── frontend/
    ├── index.html     # Main HTML page
    ├── script.js      # Frontend JavaScript
    └── style.css      # CSS styling
```

## Setup and Installation

### Prerequisites

- Node.js (v14 or higher)
- npm

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd Daily_work_log
   ```

2. Install backend dependencies:
   ```bash
   cd backend
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

4. Open your browser and navigate to `http://localhost:3000` or open `frontend/index.html` directly.

## API Endpoints

- `POST /add` - Add a new work log entry
  - Body: `{ "task": "string", "hours": number }`
- `GET /logs` - Retrieve all work log entries

## Technologies Used

- **Backend**: Node.js, Express.js, SQLite
- **Frontend**: HTML, CSS, JavaScript
- **Database**: SQLite

## Deployment

This application can be deployed to platforms like Heroku, Vercel, or any Node.js hosting service.

For Heroku deployment:
1. Create a Heroku app
2. Set the buildpack to Node.js
3. Deploy the backend folder
4. Update the frontend API calls to use the deployed backend URL

## License

ISC