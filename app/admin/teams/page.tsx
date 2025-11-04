import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import TeamManagement from '@/components/admin/TeamManagement'

export default function TeamsPage() {
  return (
    <AdminDashboardLayout>
      <TeamManagement organizationId="current-org-id" />
    </AdminDashboardLayout>
  )
}
