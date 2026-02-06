# NotesHub - Modern Academic Resource Platform

NotesHub is a premium web platform designed for students in Classes 10, 11, and 12 to access high-quality, chapter-wise and syllabus-wise PDF notes.

## Features

- **Class-wise Organization**: Dedicated sections for Class 10, 11, and 12.
- **Subject Filters**: Easily sort notes by Physics, Chemistry, Mathematics, etc.
- **Search Functionality**: Find specific chapters or topics instantly.
- **Admin Panel**: Full control over note uploads and student management.
- **Responsive Design**: Mobile-first glassmorphic UI that works on all devices.
- **SECURE AUTH**: Integrated with Firebase for student and admin authentication.

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Firebase**:
   - Go to `src/firebase/config.js`
   - Replace the placeholder configuration with your own Firebase project settings.

3. **Run Development Server**:
   ```bash
   npm run dev
   ```

4. **Production Build**:
   ```bash
   npm run build
   ```

## Admin Access
Currently, the admin dashboard is available at `/admin`. You can integrate Firebase Auth to protect this route.

## Technologies Used
- React 19
- Vite
- Framer Motion (Animations)
- Lucide React (Icons)
- Firebase (Planned Backend)
- Vanilla CSS (Custom Design System)
