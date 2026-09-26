import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { PageLoader } from '@/components/PageLoader'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { PublicLayout } from '@/layouts/PublicLayout'
import { About } from '@/pages/About'
import { Contact } from '@/pages/Contact'
import { Donate } from '@/pages/Donate'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { News } from '@/pages/News'
import { NewsDetail } from '@/pages/NewsDetail'
import { RegisterConfirmation } from '@/pages/RegisterConfirmation'

// Espace membre, inscription et vérification de carte : chargés à la demande
// pour que les visiteurs des pages publiques ne téléchargent pas tout le code.
const AdminAudit = lazy(() => import('@/pages/app/admin/AdminAudit').then((m) => ({ default: m.AdminAudit })))
const AdminContent = lazy(() => import('@/pages/app/admin/AdminContent').then((m) => ({ default: m.AdminContent })))
const AdminDues = lazy(() => import('@/pages/app/admin/AdminDues').then((m) => ({ default: m.AdminDues })))
const AdminMembers = lazy(() => import('@/pages/app/admin/AdminMembers').then((m) => ({ default: m.AdminMembers })))
const Chat = lazy(() => import('@/pages/app/Chat').then((m) => ({ default: m.Chat })))
const Dashboard = lazy(() => import('@/pages/app/Dashboard').then((m) => ({ default: m.Dashboard })))
const Discussions = lazy(() => import('@/pages/app/Discussions').then((m) => ({ default: m.Discussions })))
const Dues = lazy(() => import('@/pages/app/Dues').then((m) => ({ default: m.Dues })))
const Members = lazy(() => import('@/pages/app/Members').then((m) => ({ default: m.Members })))
const MembershipCard = lazy(() => import('@/pages/app/MembershipCard').then((m) => ({ default: m.MembershipCard })))
const PendingApproval = lazy(() => import('@/pages/app/PendingApproval').then((m) => ({ default: m.PendingApproval })))
const Profile = lazy(() => import('@/pages/app/Profile').then((m) => ({ default: m.Profile })))
const Register = lazy(() => import('@/pages/Register').then((m) => ({ default: m.Register })))
const Verify = lazy(() => import('@/pages/Verify').then((m) => ({ default: m.Verify })))
const AppLayout = lazy(() => import('@/layouts/AppLayout').then((m) => ({ default: m.AppLayout })))

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/a-propos" element={<About />} />
          <Route path="/actualites" element={<News />} />
          <Route path="/actualites/:slug" element={<NewsDetail />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/don" element={<Donate />} />
          <Route path="/inscription" element={<Register />} />
          <Route path="/inscription/confirmation" element={<RegisterConfirmation />} />
          <Route path="/connexion" element={<Login />} />
          <Route path="/verifier/:verificationId" element={<Verify />} />
        </Route>

        <Route path="/app/en-attente" element={<PendingApproval />} />

        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="profil" element={<Profile />} />
          <Route path="carte" element={<MembershipCard />} />
          <Route path="discussions" element={<Discussions />} />
          <Route path="chat" element={<Chat />} />
          <Route path="adidy" element={<Dues />} />
          <Route path="membres" element={<Members />} />
          <Route
            path="administration/membres"
            element={
              <ProtectedRoute requireAccessLevel="administrateur">
                <AdminMembers />
              </ProtectedRoute>
            }
          />
          <Route
            path="administration/adidy"
            element={
              <ProtectedRoute requireAccessLevel={['administrateur', 'responsable']}>
                <AdminDues />
              </ProtectedRoute>
            }
          />
          <Route
            path="administration/contenu"
            element={
              <ProtectedRoute requireAccessLevel="administrateur">
                <AdminContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="administration/journal"
            element={
              <ProtectedRoute requireAccessLevel="administrateur">
                <AdminAudit />
              </ProtectedRoute>
            }
          />
        </Route>
      </Routes>
    </Suspense>
  )
}

export default App
