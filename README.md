# SyncFlow - Project & Team Management App

SyncFlow is a comprehensive, production-ready web application designed for robust project and team management. It allows organizations to manage different ongoing projects, assign cross-functional teams, and track tasks via a real-time Kanban board with role-based access control.

## 🚀 Key Features

*   **Secure Authentication:** Signup and login workflows powered by Firebase Authentication (Email/Password & Google Auth).
*   **Role-Based Access Control (RBAC):** Three distinct user roles:
    *   **Admin:** Full access to create/delete projects, manage teams, and oversee the entire workspace.
    *   **Team Lead:** Can manage their assigned teams, create projects for their team, and modify tasks.
    *   **Member:** Limited access to view assigned projects, move their own tasks across the Kanban board, and collaborate without administrative privileges.
*   **Project & Team Management:**
    *   Create and configure new projects with specific team assignments (e.g., Engineering, Design, Marketing).
    *   Invite, update, and manage workspace users in the Team directory.
*   **Real-time Task Tracking:** 
    *   Interactive Kanban board (To Do, In Progress, Review, Completed) with drag-and-drop support via `@hello-pangea/dnd`.
    *   Task creation with detailed descriptions, priority settings (Low, Medium, High), due dates, and specific user assignments.
*   **Activity Dashboard:** Overview of the workspace health, displaying completion rates, overdue tasks, and a timeline of recent activity.
*   **In-App Notifications:** Real-time bell notifications alert team members when they have been assigned a new task.

## 🛠 Tech Stack

*   **Frontend Framework:** React 18 with Vite
*   **Routing:** React Router v6
*   **Styling:** Tailwind CSS + Framer Motion (for smooth animations and interactions)
*   **State Management:** Zustand (for Auth state) & TanStack React Query (for server state caching and optimistic updates)
*   **Backend & Database:** Firebase (Firestore NoSQL Database & Firebase Authentication)
*   **Forms & Validation:** React Hook Form + Zod

## 🛡 Security & Database Design

SyncFlow utilizes robust Firestore Security Rules to enforce row-level and attribute-based security:
*   Data access is inherently restricted by the user's role and team assignment.
*   Team members cannot view or interact with projects they aren't assigned to.
*   Validation logic prevents update-gaps and ensures only valid data structures are persisted to the database.

## 📦 Deployment

This project is configured out-of-the-box for easy deployment to platforms like **Railway** or **Vercel** using Nixpacks or standard Node.js build pipelines. 

### Local Development

1.  Clone the repository.
2.  Run `npm install` to install dependencies.
3.  Add your Firebase configuration credentials to the necessary environment or config files.
4.  Run `npm run dev` to start the development server.

### Deploying to Railway

The project includes a `railway.toml` file to streamline deployment:
1.  Connect your GitHub repository to Railway.
2.  The provided `railway.toml` will automatically build the project using `npm run build` and serve the static `dist/` directory via `serve`.
3.  Ensure your app environment variables (if any) are configured in the Railway dashboard.
