# Gdarden Backend Service

Backend API service for the **Gdarden** platform, providing secure authentication, multi-tenant workspace onboarding, and role-based access management.

## Tech Stack
- **Runtime**: Node.js (>=20.0.0), TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Cache & Session**: Redis
- **Authentication**: JWT, bcryptjs, Passport (Google OAuth)
- **Validation**: Zod

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Setup
Configure your `.env` file according to `.env.example`.

### 3. Run Development Server
```bash
npm run dev
```

### 4. Build
```bash
npm run build
```
