# Gdarden (OpsOS) — Authentication & Setup Flow Requirements & Implementation Plan

> **Document Status:** Verified & Ready for Execution  
> **Source Reference:** `D:\Soumy\gdarden\img` (10 Wireframe / UI Design Images)  
> **Last Updated:** 2026-10-12  

---

## 1. Project Background & Current State

- **Project:** `gdarden` (Backend API Service)
- **Tech Stack:** Node.js, Express.js, TypeScript, MongoDB (Mongoose), Redis, Zod, JWT, Nodemailer
- **Legacy Cleanup:** All legacy `greetely` / `messanmarcus` modules, models, routes, tests, documentation, and dependencies have been purged.
- **Active Core Modules:**
  - `auth`
  - `otp`
  - `user`
- **Build Status:** `tsc --noEmit` is clean (0 compilation errors).

---

## 2. In-Depth Wireframe Breakdown (Images 1 – 10)

### 🖼️ Image 1: `02 · Authentication (Screens 06 to 08.1)`
1. **06 Login Screen:**
   - Fields: `Work Email`, `Password`
   - Actions: `Sign In`, `Continue with Google`, `Continue with Apple`
   - Navigation: `Forgot Password?`, `Create an account`
2. **07 Create Account Screen:**
   - Fields: `Full Name`, `Work Email`, `Password`, `Confirm Password`
   - Agreement: `Terms of Service` & `Privacy Policy` checkbox
   - Actions: `Create Account`
3. **07.1 & 07.2 Password Rules & Filled Validation:**
   - Strict password criteria:
     - 12+ characters
     - At least 1 uppercase letter
     - At least 1 lowercase letter
     - At least 1 number
     - At least 1 special character
   - Real-time matching validation (`Passwords match` vs `Passwords do not match`)
4. **08 & 08.1 Verify Your Email (OTP):**
   - 6-digit OTP code verification
   - Expiration & "Didn't receive the code? Resend again"
   - Success state button: `Continue`

---

### 🖼️ Image 2: `02 · Authentication (Cont. - Screens 09 to 12)`
1. **09 Forgot Password:**
   - Field: `Work Email`
   - Action: `Send Verification Code`
2. **10 Verify Your Identity:**
   - 6-digit OTP code verification for password recovery
3. **11, 11.1, 11.2 Create New Password:**
   - Fields: `New Password`, `Confirm Password`
   - Real-time rule checklist & mismatch indicators
   - Action: `Reset Password`
4. **12 Password Reset Success:**
   - Modal dialog: "Password Updated - Your password has been updated successfully."
   - Action: `Back to Sign In`

---

### 🖼️ Image 3: `03 · Setup · Common (Steps 1–2 / Screens 13 to 14.2)`
1. **13 & 13.1 Create Profile (Step 1 of 8):**
   - Photo: Avatar photo upload with `Upload photo` and `Skip photo` options
   - Fields: `First Name`, `Last Name`, `Job Title`
   - `Primary Function` dropdown:
     - Options: Operations, Project Management, Facilities, HR, IT, Finance, Other
     - If `Other`: opens custom input `Describe your function`
2. **14 & 14.1 How You Will Use OpsOS (Step 2 of 8):**
   - Four onboarding tiers / paths:
     - **Individual**: Personal productivity (5 steps)
     - **Team**: Small collaborative team (7 steps)
     - **Business**: Organization with multiple teams (8 steps)
     - **Enterprise**: Large organization requiring advanced administration and security (8 steps)
3. **14.2 Compare Options Modal:**
   - Comparison sheet listing steps and workspace capabilities per tier.

---

### 🖼️ Image 4: `04 · Setup Path · Individual (5 Steps Total)`
1. **16 Choose Modules (Step 3 of 5):**
   - Select modules for personal workspace:
     - Tasks, Teams, Assets, Documents, Inventory, Reports, Calendar / Scheduling, Chat / Communication
     - Must select at least 1 module
2. **17 AI Control (Step 4 of 5):**
   - Options:
     - `Suggest Only` (Default)
     - `Approval Required`
     - `Autonomous Within Rules`
3. **18 Workspace Ready (Step 5 of 5):**
   - Summary: Modules enabled count, AI control level
   - Action: `Open My Workspace ->`

---

### 🖼️ Image 5: `05 · Setup Path · Team (7 Steps Total)`
1. **19 Create Team Workspace (Step 3 of 7):**
   - Fields: `Workspace Name`, `Team Name`
2. **20 Choose Modules (Step 4 of 7):**
   - Select modules needed for the team
3. **21 Invite Team Members (Step 5 of 7):**
   - Fields: `Email Address`, `Access Level` (`Administrator`, `Manager`, `Member`)
   - Action: `+ Add another member`, `Send Invites & Continue`, `Skip for Now`
4. **22 Set Your Team AI Control (Step 6 of 7):**
   - AI permission tier selection
5. **23 Your Team Workspace is Ready (Step 7 of 7):**
   - Summary: Modules enabled, Teams created, Members invited, AI control
   - Action: `Open My Workspace ->`

---

### 🖼️ Image 6 & 7: `06 · Setup Path · Business (8 Steps Total)`
1. **24, 24.1, 24.2 Organization Info (Step 3 of 8):**
   - `Organization Name`
   - `Industry` (Searchable picker: Manufacturing, Logistics & Supply, Construction, Healthcare, Energy & Utilities, Retail & E-commerce, Government, Tech/IT, Aerospace, Education, Hospitality, Finance, Real Estate, Automotive, Telecom, Nonprofit, Other + text)
   - `Organization Size` (1–10, 11–50, 51–250, 251–1,000, 1,001–5,000, 5,001+)
2. **25, 25.1, 25.2 Organization Structure (Step 4 of 8):**
   - Map Departments and Teams (e.g., Department `Operations` -> Teams: `Maintenance`, `Logistics`, `Facilities`)
   - Add/Remove department and team with confirmation modal
3. **26 Choose Modules (Step 5 of 8):**
   - Org-wide module selection
4. **27 & 27.1 People & Access (Step 6 of 8):**
   - Invite channels: `Invite by email`, `Upload CSV`, `Domain / SSO / SCIM`
   - Multi-member assignment: `Name`, `Email Address`, `Access Level`, `Job Role`, `Team / Department`
5. **28 Set Organization-wide AI Control (Step 7 of 8):**
   - Level selection (`Suggest Only`, `Approval Required`, `Autonomous Within Rules`)
6. **29 Workspace Ready (Step 8 of 8):**
   - Summary card: Modules enabled, Teams created, Members invited, AI control

---

### 🖼️ Image 8 & 9: `07 · Setup Path · Enterprise (8 Steps Total)`
1. **31, 31.1, 31.2 Enterprise Organization Info (Step 3 of 8):**
   - `Organization Name`, `Industry`, `Organization Size`
   - **`Primary Domain`** (e.g. `@acme.com` for domain provisioning)
2. **34 Organization Structure (Step 4 of 8):**
   - Enterprise department & team hierarchy
3. **35 Choose Modules (Step 5 of 8):**
   - Enterprise modules activation
4. **27.2 Enterprise People & Access (Step 6 of 8):**
   - Provisioning selection:
     - `Invite by email`
     - `Domain-based provisioning` (Anyone signing in with `@domain.com` joins)
     - `SCIM sync` (Identity provider integration)
     - `Bulk CSV upload`
5. **36 Govern Each AI Capability (Step 7 of 8):**
   - Granular per-capability AI governance:
     - *Incident analysis*: `Suggest Only` | `Approval Required` | `Autonomous`
     - *Auto-Calibration*: `Suggest Only` | `Approval Required` | `Autonomous`
     - *Inventory restock*: `Suggest Only` | `Approval Required` | `Autonomous`
     - *Task reassignment (low risk)*: `Suggest Only` | `Approval Required` | `Autonomous`
6. **37 Enterprise Workspace Ready (Step 8 of 8):**
   - Comprehensive summary & status checklist notice

---

### 🖼️ Image 10: `08 · Post-Setup Checklist & Recommended Settings`
1. **38.8 & 38.9 Workspace Home · Setup Checklist:**
   - Progress bar (e.g. `3 of 8 done` or `3 of 10 done`)
   - Item status tracking: Required vs Recommended vs Optional
2. **15 Personalize OpsOS (Optional):**
   - Work preference: `Structured routines`, `Flexible and responsive`, `A mix of both`
   - Notifications: `Assigned work`, `Team updates`, `Due dates & reminders`, `Incidents & changes`
   - Goals selection: Planning & Execution, Team Productivity, Asset Reliability, Process & Compliance, Cost Reduction, Performance & KPIs, Automation & AI
3. **30 Verify Domain:**
   - `DNS TXT record` verification method
   - `Email to domain admin` verification method
4. **32 Configure Security:**
   - `Require MFA` (toggle)
   - `Password Policy` (Minimum 12 chars toggle)
   - `SSO readiness` (SAML / OIDC prepare toggle)
   - `Session timeout` dropdown (e.g. 15m, 30m idle, 1h, 4h)
5. **33 Provision Users at Scale:**
   - SCIM integration, Domain auto-provisioning, Bulk CSV upload

---

## 3. Technical Architecture & Database Design

### Mongoose Models Required

1. **`User` Schema Extension:**
   - `firstName`: String
   - `lastName`: String
   - `fullName`: String
   - `jobTitle`: String
   - `primaryFunction`: String
   - `primaryFunctionCustom`: String
   - `avatar`: String
   - `onboardingPath`: `'INDIVIDUAL' | 'TEAM' | 'BUSINESS' | 'ENTERPRISE'`
   - `onboardingCurrentStep`: Number
   - `isSetupCompleted`: Boolean

2. **`Workspace` Schema (`workspace.model.ts`):**
   - `name`: String
   - `tier`: `'INDIVIDUAL' | 'TEAM' | 'BUSINESS' | 'ENTERPRISE'`
   - `ownerId`: ObjectId (ref: User)
   - `organization`:
     - `industry`: String
     - `industryCustom`: String
     - `size`: String
     - `primaryDomain`: String
     - `domainVerified`: Boolean
     - `domainVerificationToken`: String
   - `modules`: [String] (Tasks, Teams, Assets, Documents, Inventory, Reports, Calendar, Chat)
   - `aiControl`:
     - `globalLevel`: `'SUGGEST_ONLY' | 'APPROVAL_REQUIRED' | 'AUTONOMOUS'`
     - `governance`:
       - `incidentAnalysis`: String
       - `autoCalibration`: String
       - `inventoryRestock`: String
       - `taskReassignment`: String
   - `securitySettings`:
     - `requireMFA`: Boolean
     - `strictPasswordPolicy`: Boolean
     - `ssoEnabled`: Boolean
     - `sessionTimeoutMinutes`: Number
   - `provisioning`:
     - `allowDomainAutoJoin`: Boolean
     - `scimEnabled`: Boolean
   - `personalization`:
     - `workStyle`: String
     - `notificationPrefs`: Map / Object
     - `goals`: [String]

3. **`Department` & `Team` Schema (`department.model.ts`, `team.model.ts`):**
   - `workspaceId`: ObjectId (ref: Workspace)
   - `departmentId`: ObjectId (for Teams)
   - `name`: String
   - `description`: String

4. **`WorkspaceInvitation` Schema (`invitation.model.ts`):**
   - `workspaceId`: ObjectId
   - `email`: String
   - `accessLevel`: `'ADMIN' | 'MANAGER' | 'MEMBER'`
   - `jobRole`: String
   - `departmentId`: ObjectId
   - `teamId`: ObjectId
   - `status`: `'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED'`
   - `token`: String
   - `expiresAt`: Date

5. **`SetupChecklist` Schema / Resolver:**
   - Tracks dynamic completion status of profile, modules, AI control, invitations, domain verification, security setup, etc.

---

## 4. API Endpoints Plan

### Authentication (`/api/v1/auth` & `/api/v1/otp`)
- `POST /api/v1/auth/register` — Register with 12+ character password rule
- `POST /api/v1/auth/login` — Sign in with email and password
- `POST /api/v1/otp/verify-email` — Verify 6-digit registration OTP
- `POST /api/v1/otp/resend` — Resend verification code
- `POST /api/v1/auth/forgot-password` — Send 6-digit password reset OTP
- `POST /api/v1/auth/verify-reset-otp` — Verify identity for reset
- `POST /api/v1/auth/reset-password` — Set new password with confirmation and strict policy

### Setup / Onboarding Flow (`/api/v1/setup`)
- `GET /api/v1/setup/state` — Get current onboarding progress and active path
- `POST /api/v1/setup/profile` — Step 1: Upload avatar, first/last name, job title, primary function
- `POST /api/v1/setup/path` — Step 2: Choose tier (`INDIVIDUAL`, `TEAM`, `BUSINESS`, `ENTERPRISE`)
- `POST /api/v1/setup/organization` — Org name, industry, size, primary domain
- `POST /api/v1/setup/departments-teams` — Create and map departments & teams
- `DELETE /api/v1/setup/departments/:id` — Remove department
- `POST /api/v1/setup/modules` — Enable/disable modules
- `POST /api/v1/setup/invitations` — Single or bulk member email invitations
- `POST /api/v1/setup/invitations/csv` — CSV bulk invitation upload
- `POST /api/v1/setup/ai-governance` — Configure AI control (global or per-capability)
- `POST /api/v1/setup/complete` — Finalize onboarding and unlock workspace

### Post-Setup Management (`/api/v1/workspace/settings`)
- `GET /api/v1/workspace/checklist` — Real-time progress checklist
- `POST /api/v1/workspace/personalize` — Work routines, notifications, and goals
- `POST /api/v1/workspace/verify-domain/initiate` — Generate DNS TXT record
- `POST /api/v1/workspace/verify-domain/check` — Verify DNS TXT record
- `POST /api/v1/workspace/security` — Update MFA, timeout, SSO settings
- `POST /api/v1/workspace/provisioning` — Configure SCIM and domain-based provisioning

---

## 5. Next Steps for Immediate Execution When Resumed

When the user returns and instructs to proceed, the implementation will follow this sequence:
1. **Phase 1: Auth & OTP Module Updates** (12+ character validation, 6-digit reset OTP flow, clean token handling).
2. **Phase 2: Database Schema & Models** (`Workspace`, `Department`, `Team`, `WorkspaceInvitation`, updated `User`).
3. **Phase 3: Setup & Onboarding Module** (Controllers, services, Zod validators, routes for Steps 1 through 8 across all 4 tiers).
4. **Phase 4: Post-Setup & Checklist Module** (Personalization, domain TXT verification, security policies, checklist progress).
5. **Phase 5: Automated Testing & Validation** (Postman / Jest test suite verifying full flow).
