# Lead Finder Agent - Frontend

Production-grade Next.js 15 frontend for the Lead Finder Agent platform.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **State Management**: Zustand
- **HTTP Client**: Axios
- **Data Fetching**: React Query
- **Icons**: Lucide React
- **Notifications**: Sonner

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run typecheck
```

## Project Structure

```
/frontend
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx      # Home/Dashboard page
│   │   ├── layout.tsx    # Root layout
│   │   ├── globals.css   # Global styles
│   │   ├── providers.tsx # React Query & Toaster
│   │   ├── search/       # Search page
│   │   ├── leads/        # Leads listing page
│   │   └── settings/     # Settings page
│   ├── components/       # Reusable components
│   │   ├── ui/          # ShadCN UI components
│   │   ├── layout/      # Layout components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── search/      # Search components
│   │   └── leads/       # Leads components
│   ├── services/         # API services
│   ├── store/           # Zustand stores
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Library utilities
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── config/          # Configuration files
├── public/              # Static assets
├── .env.local           # Environment variables
├── tsconfig.json
├── package.json
└── README.md
```

## Available Pages

- **/** - Dashboard/Home page
- **/search** - Search for leads
- **/leads** - View leads list (connected to backend)
- **/settings** - Application settings

## Features

- Responsive SaaS dashboard
- Dark/light mode support
- Modern UI components
- Clean architecture
- TypeScript strict mode
- React Query for data fetching
- Zustand for state management

## Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
NEXT_PUBLIC_APP_NAME="Lead Finder Agent"
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## UI Components

The project uses ShadCN UI components:

- Badge
- Button
- Card
- Table
- Pagination
- Tabs
- Dropdown Menu
- Avatar

## Integration with Backend

The frontend connects to the backend API at `/api/v1`:

- Search leads (scrape from Google Maps): `POST /api/v1/search`
- Get all leads: `GET /api/v1/leads`
- Get single lead: `GET /api/v1/leads/:id`

## License

MIT
