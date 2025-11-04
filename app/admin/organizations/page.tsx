import AdminDashboardLayout from '@/components/admin/AdminDashboardLayout'
import OrganizationList from '@/components/admin/OrganizationList'

export default function OrganizationsPage() {
  return (
    <AdminDashboardLayout>
      <OrganizationList />
    </AdminDashboardLayout>
  )
}
