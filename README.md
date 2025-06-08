# GiupViecVat

A modern task marketplace platform connecting clients with skilled taskers for various household and professional services.

## 🌟 Features

### For Clients

- **Post Tasks**: Create detailed task listings with descriptions, locations, and suggested prices
- **Browse Taskers**: Find qualified professionals based on location and skills
- **Bid Management**: Review and accept bids from interested taskers
- **Real-time Messaging**: Communicate directly with taskers through integrated chat
- **Payment Integration**: Secure payment processing with Stripe
- **Review System**: Rate and review completed services

### For Taskers

- **Browse Jobs**: Discover tasks in your area across multiple categories
- **Submit Bids**: Propose your price and timeline for tasks
- **Portfolio Management**: Showcase your skills and build your reputation
- **Real-time Notifications**: Get instant updates on new opportunities
- **Earnings Tracking**: Monitor your completed tasks and earnings

### Core Categories

- 🏠 **Household** - General home maintenance and organization
- 💻 **Tech** - Computer repair, setup, and technical support
- 🚗 **Transportation** - Moving assistance and delivery services
- 🔧 **Repairs** - Appliance and equipment fixes
- 🧹 **Cleaning** - Professional cleaning services
- 🌱 **Gardening** - Landscaping and garden maintenance
- 📦 **Moving** - Packing, moving, and unpacking services
- 🛠️ **Handyman** - General repairs and installations

## 🏗️ Technical Architecture

### Frontend (React + TypeScript)

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS for modern, responsive design
- **Routing**: React Router for navigation
- **State Management**: Context API for global state
- **Build Tool**: Vite for fast development and building
- **Real-time**: Socket.IO client for live updates

### Backend (Node.js + Express)

- **Runtime**: Node.js with Express framework
- **Language**: TypeScript for type safety
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT-based auth with bcrypt password hashing
- **Real-time**: Socket.IO for live notifications and chat
- **Security**: Helmet for security headers, CORS configuration
- **Payments**: Stripe integration for secure transactions

### Key Technologies

- **Database**: MongoDB for flexible document storage
- **Real-time Communication**: Socket.IO for instant messaging and notifications
- **Payment Processing**: Stripe for secure financial transactions
- **Geolocation**: Coordinate-based location services
- **File Upload**: Avatar and document handling
- **Memory Store**: Development-friendly in-memory data store option

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- MongoDB (local or Atlas)
- Stripe account (for payments)

### Installation

1. **Clone the repository**

   ```bash git clone https://github.com/Gentle226/GiupViecVat.git
   cd GiupViecVat
   ```

2. **Install dependencies**

   ```bash
   # Install root dependencies
   npm install

   # Install frontend dependencies
   cd frontend
   npm install

   # Install backend dependencies
   cd ../backend
   npm install

   # Install shared dependencies
   cd ../shared
   npm install
   ```

3. **Environment Setup**

   Create `.env` file in the backend directory:

   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/giupviecvat
   JWT_SECRET=your-super-secret-jwt-key
   STRIPE_SECRET_KEY=your-stripe-secret-key
   STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
   ```

4. **Start the development servers**

   You can use the VS Code tasks or run manually:

   **Using VS Code Tasks:**

   - Open Command Palette (`Ctrl+Shift+P`)
   - Run `Tasks: Run Task`
   - Select "Start Backend Development Server"
   - Select "Start Frontend Development Server"

   **Manual Start:**

   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📁 Project Structure

```
GiupViecVat/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Route components
│   │   ├── contexts/        # React Context providers
│   │   ├── hooks/           # Custom React hooks
│   │   ├── services/        # API service functions
│   │   └── utils/           # Utility functions
│   ├── public/              # Static assets
│   └── package.json
├── backend/                 # Node.js Express backend
│   ├── src/
│   │   ├── routes/          # API route handlers
│   │   ├── models/          # Database models
│   │   ├── middleware/      # Express middleware
│   │   ├── socket/          # Socket.IO handlers
│   │   ├── data/            # Data access layer
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Backend utilities
│   └── package.json
├── shared/                  # Shared types and utilities
│   ├── types.ts             # Common TypeScript interfaces
│   └── package.json
└── package.json             # Root package configuration
```

## 🔑 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Tasks

- `GET /api/tasks` - List tasks with filters
- `POST /api/tasks` - Create new task
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/complete` - Mark task complete

### Bids

- `POST /api/bids` - Submit bid
- `GET /api/bids/task/:taskId` - Get task bids
- `GET /api/bids/my-bids` - Get user's bids
- `PATCH /api/bids/:id/accept` - Accept bid

### Messages

- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversations/:id/messages` - Get conversation messages
- `POST /api/messages` - Send message

### Users

- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/tasks` - Get user's tasks
- `GET /api/users/:id/reviews` - Get user reviews

## 🔄 Real-time Features

The application uses Socket.IO for real-time functionality:

### Events

- **New Messages**: Instant chat delivery
- **Bid Notifications**: Real-time bid updates
- **Task Status Changes**: Live task status updates
- **User Presence**: Online/offline status indicators

### Socket Events

- `join_room` - Join task-specific rooms
- `send_message` - Send chat messages
- `new_bid` - Bid submission notifications
- `task_update` - Task status changes
- `user_online/offline` - Presence updates

## 🛡️ Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Password Change**: Secure password update with validation
- **Password Strength**: Real-time strength indicator and requirements
- **Input Validation**: Request data validation and sanitization
- **CORS Protection**: Configured cross-origin resource sharing
- **Rate Limiting**: API rate limiting for abuse prevention
- **Helmet Security**: Security headers for Express

## 🔗 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/change-password` - Change user password

### Tasks

- `GET /api/tasks` - List tasks with filters
- `POST /api/tasks` - Create new task (Client only)
- `GET /api/tasks/:id` - Get task details
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/complete` - Mark task complete

### Bids

- `POST /api/bids` - Submit bid (Tasker only)
- `GET /api/bids/task/:taskId` - Get task bids
- `GET /api/bids/my-bids` - Get user's bids
- `PATCH /api/bids/:id/accept` - Accept bid

### Messages

- `GET /api/messages/conversations` - Get conversations
- `GET /api/messages/conversations/:id/messages` - Get conversation messages
- `POST /api/messages` - Send message

### Users

- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/tasks` - Get user's tasks
- `GET /api/users/:id/reviews` - Get user's reviews

### Reviews

- `POST /api/reviews` - Create review
- `GET /api/reviews/user/:userId` - Get user reviews
- `GET /api/reviews/task/:taskId` - Get task reviews

### Payments

- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/payments/my-payments` - Get user payments

## 💾 Database Schema

### User Model

- Personal information and authentication
- Location data with geospatial indexing
- Rating and review statistics
- Skills and bio for taskers

### Task Model

- Task details and requirements
- Location and pricing information
- Status tracking and assignments
- Category-based organization

### Bid Model

- Bid amount and messaging
- Status tracking (pending/accepted/rejected)
- Estimated duration and timeline

### Message/Conversation Models

- Real-time messaging system
- Task-based conversation threading
- Read receipts and timestamps

## 🚧 Development

### Available Scripts

**Frontend:**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

**Backend:**

- `npm run dev` - Start with nodemon
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server

### Code Style

- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Consistent naming conventions

### Testing

Currently using development data seeding for testing. Future improvements will include:

- Unit tests with Jest
- Integration tests for API endpoints
- E2E tests with Cypress

## 🌐 Deployment

### Environment Variables

Ensure all required environment variables are set:

- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `STRIPE_SECRET_KEY` - Stripe secret key
- `NODE_ENV` - Environment (production/development)

### Build Process

```bash
# Build frontend
cd frontend && npm run build

# Build backend
cd ../backend && npm run build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support, please open an issue in the repository or contact the development team.

---

**GiupViecVat** - Connecting communities through trusted task sharing. 🏠✨
