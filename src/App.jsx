import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Lazy loading pages for better performance
const Home = lazy(() => import('./pages/user/Home'));
const ClassSelect = lazy(() => import('./pages/user/ClassSelect'));
const SubjectSelect = lazy(() => import('./pages/user/SubjectSelect'));
const NoteList = lazy(() => import('./pages/user/NoteList'));
const NoteDetail = lazy(() => import('./pages/user/NoteDetail'));
const UserAuth = lazy(() => import('./pages/user/Auth'));
const DailyQuiz = lazy(() => import('./pages/user/DailyQuiz'));

const AdminLogin = lazy(() => import('./pages/admin/Login'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const UploadNote = lazy(() => import('./pages/admin/UploadNote'));
const ManageNotes = lazy(() => import('./pages/admin/ManageNotes'));
const UsersList = lazy(() => import('./pages/admin/Users'));
const Requests = lazy(() => import('./pages/admin/Requests'));
const Payments = lazy(() => import('./pages/admin/Payments'));
const UploadQuiz = lazy(() => import('./pages/admin/UploadQuiz'));

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen bg-cream-light">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pista-dark"></div>
  </div>
);

import { Toaster } from 'react-hot-toast';

const App = () => {
  return (
    <Router>
      <Toaster position="top-right" reverseOrder={false} />
      <Suspense fallback={<LoadingFallback />}>
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/classes" element={<ClassSelect />} />
          <Route path="/class/:classId" element={<SubjectSelect />} />
          <Route path="/notes/:classId/:subjectId" element={<NoteList />} />
          <Route path="/note/:noteId" element={<NoteDetail />} />
          <Route path="/login" element={<UserAuth />} />
          <Route path="/daily-quiz" element={<DailyQuiz />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/upload" element={<UploadNote />} />
          <Route path="/admin/manage" element={<ManageNotes />} />
          <Route path="/admin/users" element={<UsersList />} />
          <Route path="/admin/payments" element={<Payments />} />
          <Route path="/admin/quizzes" element={<UploadQuiz />} />
          <Route path="/admin/requests" element={<Requests />} />

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
};

export default App;
