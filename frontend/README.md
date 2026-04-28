# haAidra Frontend

A production-ready React frontend for haAidra - an AI-powered call center quality assurance platform.

## 🚀 Features

- **Modern Tech Stack**: React 19, Vite, TanStack Query, Tailwind CSS, Framer Motion
- **Role-Based Access Control**: Admin, Manager, QA Supervisor, and Agent roles
- **Real-time Analytics**: Live dashboard with KPIs, charts, and leaderboards
- **Call Management**: Upload, analyze, and review call recordings
- **Quality Assurance**: AI-powered scoring and manual review workflows
- **Responsive Design**: Mobile-first design with beautiful animations
- **TypeScript Ready**: Built with modern JavaScript practices

## 🛠 Tech Stack

### Core Framework
- **React 19** - Latest React with concurrent features
- **Vite 8** - Fast development server and optimized builds
- **React Router v6** - File-based routing with nested routes

### State Management & Data Fetching
- **TanStack Query (React Query)** - Server state management and caching
- **Axios** - HTTP client with interceptors for auth and error handling

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Data visualization and charts
- **Inter Font** - Clean, modern typography

### Development Tools
- **ESLint** - Code linting and formatting
- **PostCSS** - CSS processing with Tailwind

## 📁 Project Structure

```
src/
├── lib/                    # Core utilities and configuration
│   ├── api.js             # Axios instance with interceptors
│   ├── auth.js            # Authentication helpers
│   ├── queryClient.js     # TanStack Query configuration
│   └── utils.js           # Utility functions
├── hooks/                  # Custom React hooks
│   ├── useAuth.js         # Authentication state
│   ├── useCalls.js        # Call data management
│   ├── useAnalysis.js     # Analysis data
│   ├── useDashboard.js    # Dashboard metrics
│   ├── useReports.js      # Report generation
│   ├── useUsers.js        # User management
│   ├── useReviews.js      # QA reviews
│   └── useScoring.js      # Scoring configuration
├── components/            # Reusable UI components
│   ├── layout/            # Layout components
│   ├── ui/                # Base UI components
│   ├── calls/             # Call-specific components
│   ├── analysis/          # Analysis components
│   ├── dashboard/         # Dashboard components
│   └── reports/           # Report components
└── pages/                 # Page components
    ├── auth/              # Authentication pages
    ├── dashboard/         # Dashboard page
    ├── calls/             # Call management
    ├── reports/           # Report generation
    ├── users/             # User management
    ├── reviews/           # QA reviews
    └── settings/          # Settings pages
```

## 🎨 Design System

### Color Palette
- **Primary**: Indigo (#6366F1) - Main actions and navigation
- **Secondary**: Emerald (#10B981) - Success and positive states
- **Danger**: Red (#EF4444) - Errors and destructive actions
- **Warning**: Amber (#F59E0B) - Warnings and pending states
- **Neutral**: Gray scale for text and backgrounds

### Typography
- **Font**: Inter (Google Fonts)
- **Weights**: 300, 400, 500, 600, 700
- **System**: Clean, modern, and highly readable

### Animation Principles
- **Page Transitions**: Fade-in + slide up (0.35s)
- **Card Stagger**: Sequential animations (0.05s delay)
- **Micro-interactions**: Button press, hover states
- **Loading States**: Skeleton screens and spinners

## 🔐 Authentication & Authorization

### Role Hierarchy
1. **Admin** - Full system access
2. **Manager** - Dashboard, reports, agents, reviews
3. **QA Supervisor** - Calls, agents, reviews
4. **Agent** - Own calls and analysis only

### JWT Token Management
- Automatic token refresh on 401 errors
- Secure storage in localStorage
- Request/response interceptors

## 📊 Key Features

### Dashboard
- Real-time KPI cards with animated counters
- Interactive charts (volume, sentiment, score trends)
- Agent leaderboard with performance metrics
- Customizable date ranges

### Call Management
- Audio file upload with drag-and-drop
- Real-time processing status
- Detailed call analysis with tabs
- Flagging and annotation tools

### Quality Assurance
- AI-powered scoring with 6 dimensions
- Manual review and override capabilities
- Coaching notes and feedback
- Historical performance tracking

### Reports
- 9 different report types
- PDF and Excel export formats
- Custom date ranges and filters
- Agent-specific reporting

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd haAidraMVP/frontend
```

2. Install dependencies:
```bash
npm install
```

3. Environment setup:
```bash
cp .env.example .env.local
# Edit .env.local with your API configuration
```

4. Start development server:
```bash
npm run dev
```

5. Build for production:
```bash
npm run build
```

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1/
VITE_ENV=development
```

## 🔄 API Integration

### Base Configuration
- Base URL: `/api/v1/`
- Timeout: 30 seconds
- Automatic JWT attachment
- Error handling with toast notifications

### Key Endpoints
- `POST /auth/login/` - User authentication
- `GET /calls/` - Call listing with filters
- `POST /calls/` - Upload new call
- `GET /dashboard/kpi/` - Dashboard metrics
- `GET /reports/{type}/` - Report generation

## 🎯 Performance Optimizations

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: Responsive images with lazy loading
- **Bundle Analysis**: Optimized chunk splitting
- **Caching Strategy**: TanStack Query with intelligent caching
- **Animation Performance**: GPU-accelerated transforms

## 🧪 Development Guidelines

### Code Standards
- Functional components with hooks
- TypeScript-ready patterns
- Consistent naming conventions
- Comprehensive error handling

### Component Architecture
- Single responsibility principle
- Reusable UI components
- Composition over inheritance
- Props interface documentation

### State Management
- Server state with TanStack Query
- Local state with React hooks
- Context for global auth state
- Minimal prop drilling

## 📱 Responsive Design

### Breakpoints
- **Mobile**: ≥375px
- **Tablet**: ≥768px  
- **Desktop**: ≥1280px

### Mobile Considerations
- Touch-friendly interface
- Simplified navigation
- Optimized charts for small screens
- Collapsible sidebars

## 🔧 Customization

### Theming
Update `tailwind.config.js` to customize:
- Color palette
- Typography scales
- Breakpoints
- Animation durations

### Component Extensions
- Add new UI components in `src/components/ui/`
- Follow existing patterns
- Include proper TypeScript types
- Add comprehensive documentation

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Preview
```bash
npm run preview
```

### Docker Support
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "run", "preview"]
```

## 🤝 Contributing

1. Follow the existing code style
2. Write comprehensive tests
3. Update documentation
4. Use semantic commit messages
5. Ensure accessibility compliance

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For questions and support:
- Review the documentation
- Check existing issues
- Create detailed bug reports
- Include reproduction steps

---

Built with ❤️ for haAidra - Transforming call center quality assurance with AI.
