# Vapi Dashboard

A comprehensive analytics dashboard for Vapi voice assistants with real-time call tracking, analytics, and management features.

## Features

- 📊 **Real-time Analytics** - Live insights into voice assistant performance
- 📞 **Call History** - Complete call tracking with transcripts
- 🤖 **Assistant Management** - Create, edit, and manage voice assistants
- 🔄 **Automated Data Sync** - Hourly cron jobs to keep data fresh
- 🌙 **Dark Mode** - Beautiful dark/light theme support
- 📱 **Responsive Design** - Works on desktop and mobile
- 🔐 **Authentication** - Secure user authentication with Supabase
- 📈 **Export Data** - Export analytics and call history to CSV

## Tech Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Shadcn UI
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **API**: Vapi API for voice assistant data
- **Deployment**: Vercel
- **Charts**: Recharts

## Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account
- Vapi account with API key

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd vapi-dashboard
npm install
```

### 2. Environment Setup

Create `.env.local` file:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Vapi
VAPI_API_KEY=your-vapi-api-key

# Cron Job (optional)
CRON_SECRET=your-secure-random-string
```

### 3. Database Setup

Run the SQL migrations in your Supabase SQL editor:

1. **Initial Setup**: `database-setup.sql`
2. **Analytics Enhancement**: `analytics-enhancement-migration.sql`
3. **Call History**: `call-history-migration.sql`

### 4. Development

```bash
npm run dev
```

Visit `http://localhost:3000`

## Deployment

### Vercel (Recommended)

1. **Connect to GitHub**:
   ```bash
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Deploy to Vercel**:
   - Connect your GitHub repo to Vercel
   - Add environment variables in Vercel dashboard
   - Deploy automatically on every push

3. **Set up Cron Jobs**:
   - Vercel will automatically use the `vercel.json` configuration
   - Add `CRON_SECRET` to your environment variables

### Manual Deployment

```bash
npm run build
npm start
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VAPI_API_KEY` | Vapi API key | Yes |
| `CRON_SECRET` | Secret for cron job authentication | No |

## API Endpoints

### Analytics
- `GET /api/analytics` - Get analytics data
- `POST /api/analytics` - Query Vapi analytics with filters

### Assistants
- `GET /api/assistants` - Get user's assistants
- `POST /api/assistants` - Create new assistant
- `PATCH /api/assistants/[id]` - Update assistant
- `DELETE /api/assistants/[id]` - Delete assistant

### Call History
- `GET /api/call-history` - Get call history with filters
- `POST /api/call-history` - Fetch and store call data
- `POST /api/cron/call-history` - Automated cron job endpoint

## Cron Jobs

The dashboard includes automated data collection:

- **Call History Sync**: Every hour
- **Analytics Refresh**: On-demand and automated
- **Assistant Status Updates**: Real-time

### Manual Cron Job Setup

If not using Vercel, set up external cron:

```bash
# Every hour
0 * * * * curl -X POST https://your-domain.com/api/cron/call-history \
  -H "Authorization: Bearer your-cron-secret"
```

## Project Structure

```
src/
├── app/                    # Next.js app router
│   ├── analytics/         # Analytics dashboard
│   ├── assistants/        # Assistant management
│   ├── call-history/      # Call history page
│   ├── dashboard/         # Main dashboard
│   ├── api/              # API routes
│   └── ...
├── components/            # React components
│   ├── ui/               # Shadcn UI components
│   └── ...
├── contexts/             # React contexts
├── hooks/                # Custom hooks
└── lib/                  # Utility functions
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

---

Built with ❤️ for Vapi voice assistants
