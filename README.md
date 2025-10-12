# Local first todo app

What's better than the good ol' todo app, am I right?

## Technologies

- **[RxDB](https://rxdb.info/)** - Local-first database with replication
- **[TanStack Router](https://tanstack.com/router)** - Type-safe routing
- **[TanStack Query](https://tanstack.com/query)** - Data fetching and state management
- **[TanStack DB](https://tanstack.com/db)** - Database integration layer
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Express** - Mock API server

## Features

- Offline-first architecture
- Local data persistence with RxDB
- Real-time synchronization
- Multiple todo lists
- Type-safe routing and data fetching

## Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm

### Installation

```bash
pnpm install
```

### Running the App

Run both the frontend and backend:

```bash
pnpm run dev:all
```

Or run them separately:

```bash
# Terminal 1: Start the mock API server
pnpm run dev:server

# Terminal 2: Start the Vite dev server
pnpm dev
```

The app will be available at `http://localhost:5173` (default Vite port) and the API at `http://localhost:3002`.

## Project Status

⚠️ This is a proof-of-concept project for exploring local-first architecture patterns.

## License

MIT