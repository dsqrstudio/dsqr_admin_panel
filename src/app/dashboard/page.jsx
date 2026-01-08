// Make the '/dashboard' route unreachable by redirecting to '/'
import { redirect } from 'next/navigation'

export default function DashboardRouteRedirect() {
  redirect('/')
}
