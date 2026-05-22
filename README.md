# MockKeys
A lightweight mock API server — define custom endpoints with any HTTP method and serve static JSON responses instantly.

## Stack
- Node.js + Express
- SQLite file as database (no native bindings needed)
- Vanilla HTML/CSS/JS frontend

## Project Structure
```
MockKeys/
├── config/
│   └── index.js           # Configuration (port, DB path, CORS)
├── services/
│   ├── database.js        # Database initialization and operations
│   └── endpointService.js # Business logic for endpoints
├── middleware/
│   ├── validation.js      # Input validation middleware
│   └── errorHandler.js    # Error handling and 404
├── controllers/
│   └── endpointController.js # Request handlers
├── routes/
│   ├── endpoints.js       # API endpoint routes
│   └── mock.js            # Mock catch-all routes
└── server.js              # Main app
```

## Setup

### Local Development
```bash
npm install
node server.js
```

Server starts at **http://localhost:3008**

### Docker
```bash
docker build -t mockkeys .
docker run -p 3008:3008 -v $(pwd)/db:/app/db mockkeys
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3008 | Server port |
| `DB_PATH` | `./db/data.sqlite` | Path to SQLite database file |
| `CORS_ORIGIN` | `*` | CORS allowed origin |
| `NODE_ENV` | - | Set to `development` for error stack traces |

## How it works

1. Open http://localhost:3008 in your browser
2. Fill in:
   - **Method** — GET, POST, PUT, PATCH, DELETE
   - **Slug** — your custom path (e.g. `users/profile`)
   - **Status Code** — HTTP status to return (default 200)
   - **Response Body** — valid JSON
3. Click **Create Endpoint**
4. Your endpoint is live at: `http://localhost:3008/mock/<your-slug>`

## API

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/endpoints | List all endpoints |
| POST | /api/endpoints | Create endpoint |
| PUT | /api/endpoints/:id | Update endpoint |
| DELETE | /api/endpoints/:id | Delete endpoint |
| ANY | /mock/* | Serve mock response |

## Example

Create a `GET` endpoint with slug `users` and response:
```json
{ "data": [{"id": 1, "name": "Alice"}], "total": 1 }
```

Then fetch it:
```bash
curl http://localhost:3008/mock/users
```

## Production

### Health Check
The server includes a health check endpoint for monitoring:
```bash
curl http://localhost:3008/
```

### Using Environment Variables
```bash
PORT=8080 CORS_ORIGIN=https://myapp.com node server.js
```

### Database Backup
The SQLite database is persisted to `db/data.sqlite`. Back up this file to preserve your endpoints.

## Development

The project follows a layered architecture for maintainability:

- **config/** - Environment-based configuration
- **services/** - Business logic and data access layer
- **controllers/** - HTTP request/response handling
- **middleware/** - Validation and error handling
- **routes/** - Route definitions

## Commands:
```
npm run migrate - To run migrations
```