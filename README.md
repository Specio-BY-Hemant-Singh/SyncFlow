DEMO- https://syncflow.up.railway.app/
# SyncFlow - Project & Team Management App

SyncFlow is a comprehensive, production-ready web application designed for robust project and team management. It allows organizations to manage different ongoing projects, assign cross-functional teams, and track tasks via a real-time Kanban board with role-based access control.


## 🚀 Key Features

*   **Secure Authentication:** Signup and login workflows powered by Firebase Authentication (Email/Password & Google Auth).
*   **Real-time Task Tracking:** 
    *   Interactive Kanban board (To Do, In Progress, Review, Completed) with drag-and-drop support via `@hello-pangea/dnd`.
    *   Task creation with detailed descriptions, priority settings (Low, Medium, High), due dates, and specific user assignments.
*   **Activity Dashboard:** Overview of the workspace health, displaying completion rates, overdue tasks, and a timeline of recent activity.
*   **In-App Notifications:** Real-time bell notifications alert team members when they have been assigned a new task.

## 👥 User Roles & Access Levels

SyncFlow features Role-Based Access Control (RBAC) with three distinct user roles, ensuring secure and organized team collaboration:

### 👑 Admin
The workspace owner or system administrator.
*   **Projects:** Can view, create, edit, and delete **all** projects across the entire workspace.
*   **Tasks:** Can view, create, edit, move, and delete **all** tasks in any project.
*   **Team:** Full access to manage the team directory. Can invite new members, change user roles (e.g., promote a Member to Team Lead), and assign users to specific teams (e.g., Engineering, Design).
*   **Visibility:** Complete visibility over all workspace data, analytics, and activities.

### 🎯 Team Lead
A manager responsible for specific teams.
*   **Projects:** Can view projects assigned to their team(s). Can create new projects and assign them to their team.
*   **Tasks:** Can view, create, edit, move, and delete tasks within the projects assigned to their team.
*   **Team:** Can view the team directory and see team members, but typically cannot change roles or perform workspace-level administrative actions.
*   **Visibility:** Full visibility over the progress, tasks, and members of their specific team(s).

### 👤 Member
A standard user, such as a developer, designer, or marketer.
*   **Projects:** Can only view projects that are assigned to their specific team. Cannot create new projects.
*   **Tasks:** Can view tasks within their team's projects. Can drag-and-drop/move tasks they are assigned to across the Kanban board. Can update task details and leave comments on tasks they have access to.
*   **Team:** Can view the team directory to see who else is in the workspace.
*   **Visibility:** Limited visibility; focused primarily on their assigned tasks and the progress of their immediate team's projects.

## 🔑 Default Demo Users

To easily explore and test the application, several demographic users with different roles are pre-configured. Use the following credentials on the login page:

| User Role | Email Address | Password | Access Level Info |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@syncai.com` | `password123` | Full access to everything. Best for testing workspace-wide management, creating projects, editing user roles, and full visibility. |
| **Team Lead** | `lead@syncai.com` | `password123` | Can manage specific assigned teams, create related projects, and oversee tasks within their teams. |
| **Member 1** | `employee1@syncai.com` | `password123` | Standard team member. Can interact with assigned tasks, move tasks across the board, and view assigned projects. |
| **Member 2** | `employee2@syncai.com` | `password123` | Standard team member. |
| **Member 3** | `employee3@syncai.com` | `password123` | Standard team member. |

**Instructions to use:**
1. Navigate to the deployed application URL.
2. Go to the "**Log In**" page.
3. Enter one of the Email addresses and the shared password (`password123`) from the table above.
4. Explore the interface and interact with actions available to that specific role (e.g., attempt to create a project as an Admin vs. a Member).
5. Log out and try another user account to see how the UI and permissions shift based on the role.

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

