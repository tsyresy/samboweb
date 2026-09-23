import { Route, Routes } from 'react-router-dom'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { AppLayout } from '@/layouts/AppLayout'
import { PublicLayout } from '@/layouts/PublicLayout'
import { About } from '@/pages/About'
import { AdminMembers } from '@/pages/app/admin/AdminMembers'
import { ComingSoon } from '@/pages/app/ComingSoon'
import { Dashboard } from '@/pages/app/Dashboard'
import { Members } from '@/pages/app/Members'
import { MembershipCard } from '@/pages/app/MembershipCard'
import { PendingApproval } from '@/pages/app/PendingApproval'
import { Profile } from '@/pages/app/Profile'
import { Contact } from '@/pages/Contact'
import { Donate } from '@/pages/Donate'
import { Home } from '@/pages/Home'
import { Login } from '@/pages/Login'
import { News } from '@/pages/News'
import { NewsDetail } from '@/pages/NewsDetail'
import { Register } from '@/pages/Register'
import { RegisterConfirmation } from '@/pages/RegisterConfirmation'
import { Verify } from '@/pages/Verify'

function App() {
  return (
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
        <Route path="discussions" element={<ComingSoon title="Discussions" />} />
        <Route path="adidy" element={<ComingSoon title="Mes adidy" />} />
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
            <ProtectedRoute requireAccessLevel="administrateur">
              <ComingSoon title="Gestion des adidy" />
            </ProtectedRoute>
          }
        />
        <Route
          path="administration/contenu"
          element={
            <ProtectedRoute requireAccessLevel="administrateur">
              <ComingSoon title="Contenus et messages" />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  )
}

export default App
