import { AuthProvider } from './context/AuthContext.jsx';
import { BrowserRouter, Route, Routes } from 'react-router';
import AppLayout from './components/layout/AppLayout.jsx';
import RequireAdmin from './components/layout/RequireAdmin.jsx';
import AuthLayout from './components/layout/AuthLayout.jsx';
import AuthForm from './components/layout/AuthForm.jsx';
import FeedbackBoard from './pages/FeedbackBoard.jsx';
import FeedbackDetails from './pages/FeedbackDetails.jsx';
import Roadmap from './pages/Roadmap.jsx';
import AdminDashboard from './pages/AdminDashboard.jsx';
import NotFound from './pages/NotFound.jsx';
export default function App() { return <BrowserRouter><AuthProvider><Routes><Route element={<AppLayout />}><Route index element={<FeedbackBoard />} /><Route path="feedback/:id" element={<FeedbackDetails />} /><Route path="roadmap" element={<Roadmap />} /><Route element={<RequireAdmin />}><Route path="admin" element={<AdminDashboard />} /></Route><Route path="*" element={<NotFound />} /></Route><Route element={<AuthLayout />}><Route path="login" element={<AuthForm />} /><Route path="register" element={<AuthForm register />} /></Route></Routes></AuthProvider></BrowserRouter>; }
