# University Student Tracking Platform (USTP)

## Overview

This is a full-stack web application built for managing student attendance and academic records at the University of Science and Technology of Southern Philippines (USTP). The system supports two user roles: teachers who can manage classes, track attendance, and generate reports; and students who can view their attendance records, grades, and schedule consultations.

## System Architecture

The application follows a modern full-stack architecture with clear separation between client and server:

- **Frontend**: React 18 with TypeScript, using Vite for development and building
- **Backend**: Express.js server with TypeScript 
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build System**: Vite for frontend, esbuild for backend bundling

## Key Components

### Frontend Architecture
- **Component Structure**: Built with reusable UI components using Radix UI primitives
- **Pages**: Role-based page structure with separate dashboards for teachers and students
- **Hooks**: Custom hooks for authentication (`use-auth`) and toast notifications (`use-toast`)
- **Styling**: Custom USTP brand colors integrated with Tailwind CSS design system

### Backend Architecture
- **API Routes**: RESTful API endpoints for authentication, classes, students, and attendance
- **Database Layer**: Abstracted storage interface with PostgreSQL implementation using Drizzle ORM
- **Session Management**: Express sessions for user authentication
- **Middleware**: Request logging and error handling middleware

### Database Schema
The database uses PostgreSQL with the following main entities:
- **Users**: Core user information with role-based access (teacher/student)
- **Classes**: Course information managed by teachers
- **Students**: Extended student profile data linked to users
- **Class Enrollments**: Many-to-many relationship between students and classes
- **Attendance Records**: Daily attendance tracking with status (present/absent/late)
- **Consultations**: Student-teacher consultation scheduling system
- **Grades**: Student grade management (partially implemented)

## Data Flow

1. **Authentication**: Users log in with role-based credentials (teacher/student)
2. **Dashboard**: Role-specific dashboards display relevant information
3. **Data Management**: Teachers can create/manage classes, track attendance, and generate reports
4. **Student Access**: Students can view their attendance, grades, and request consultations
5. **Real-time Updates**: TanStack Query handles caching and real-time data synchronization

## External Dependencies

### Core Framework Dependencies
- React ecosystem (React, React DOM, TypeScript)
- Express.js for server framework
- PostgreSQL via Neon Database (@neondatabase/serverless)
- Drizzle ORM for database operations

### UI/UX Dependencies
- Radix UI components for accessible UI primitives
- Lucide React for icons
- Tailwind CSS for styling
- shadcn/ui component system

### Development Tools
- Vite for development server and building
- ESBuild for server bundling
- TypeScript for type safety
- Various React Query and form handling libraries

## Deployment Strategy

### Development Environment
- **Local Development**: Uses Vite dev server with Express backend
- **Database**: Neon PostgreSQL database with connection pooling
- **Hot Reload**: Vite HMR for frontend, tsx for backend development

### Production Deployment
- **Build Process**: Vite builds frontend static assets, esbuild bundles server
- **Deployment Target**: Configured for Replit autoscale deployment
- **Static Assets**: Frontend built to `dist/public`, served by Express in production
- **Environment**: Production mode uses compiled JavaScript from `dist/index.js`

### Replit Configuration
- **Runtime**: Node.js 20 with PostgreSQL 16 module
- **Port Configuration**: Internal port 5000, external port 80
- **Build Commands**: `npm run build` for production builds
- **Start Commands**: `npm run start` for production, `npm run dev` for development

## Changelog

Changelog:
- June 14, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.