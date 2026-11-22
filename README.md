# CampusCare

Campus Health Services Scheduling & Emergency Response Coordination Platform.

A unified health services management platform connecting students, university clinicians, campus paramedics, and administrators.

## Features

- **Clinic & Specialist Scheduling**: 4-step wizard to book campus appointments across departments with doctor reviews and ratings.
- **Emergency SOS Dispatch**: Rapid response beacon with real-time geolocation telemetry and ambulance coordination.
- **Student Medical Portal**: Confidential digital health records, diagnostic test reports, and clinical history.
- **Clinician & Staff Console**: Availability management, patient lookup directory, clinical referrals, and performance reviews.
- **Ambulance Telemetry**: Live dispatch queue, status management, route map navigation, and patient handoff.
- **Administrative Command Center**: Operational analytics, user access governance, fleet management, and privacy compliance logs.

## Getting Started

### 1. Environment Variables

Create a `.env.local` file in the root directory. The following environment variables are required:

- `MONGODB_URI`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Admin Account

Seed the initial administrator account into the database:

```bash
npm run seed:admin
```

### 4. (Optional) Seed Demo Data

To populate the application with realistic demo records (students, clinicians, appointments, ambulances, reviews):

```bash
npm run seed:demo
```

To remove all demo data:

```bash
npm run clear:demo
```

### 5. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
