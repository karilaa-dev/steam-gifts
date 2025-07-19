# How to Start the Steam Gifts Website

## Proper Startup Command

To start the full Steam Gifts website (both backend and frontend), use:

```bash
bun run dev:full
```

## What This Does

- **Backend**: Starts the server on port 3000 (API endpoints)
- **Frontend**: Starts the Vite development server on port 5173 (React client)

## Other Commands

- `bun run dev` - Starts only the backend server
- `bun run build` - Builds the application for production
- `bun run preview` - Previews the production build

## Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000/api

## Note

Always use `bun run dev:full` when testing the complete application, especially when testing features that require both frontend and backend interaction, such as Steam authentication and wishlist viewing.