
import { auth } from '@/app/(auth)/auth';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { user, payment } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UpgradeUsersButton } from './components/upgrade-users-button';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

async function getUsersWithPayments() {
  return await db
    .select({
      user: user,
      completedPayments: db.$count(payment, and(
        eq(payment.userId, user.id),
        eq(payment.status, 'completed')
      )),
    })
    .from(user)
    .leftJoin(payment, eq(payment.userId, user.id))
    .groupBy(user.id)
    .orderBy(desc(user.createdAt));
}

async function getPaymentStats() {
  const totalUsers = await db.$count(user);
  const paidUsers = await db.$count(user, eq(user.role, 'paiduser'));
  const adminUsers = await db.$count(user, eq(user.role, 'admin'));
  const regularUsers = await db.$count(user, eq(user.role, 'user'));
  
  const completedPayments = await db.$count(payment, eq(payment.status, 'completed'));
  
  return {
    totalUsers,
    paidUsers,
    adminUsers,
    regularUsers,
    completedPayments,
  };
}

export default async function AdminUsersPage() {
  const session = await auth();

  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  const users = await getUsersWithPayments();
  const stats = await getPaymentStats();

  // Users who have payments but are still 'user' role
  const usersNeedingUpgrade = users.filter(
    u => u.completedPayments > 0 && u.user.role === 'user'
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            User Management
          </h1>
          <p className="text-gray-600">
            Manage user roles and payment status
          </p>
        </div>
        
        {usersNeedingUpgrade.length > 0 && (
          <UpgradeUsersButton count={usersNeedingUpgrade.length} />
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalUsers}</div>
            <div className="text-sm text-gray-600">Total Users</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{stats.paidUsers}</div>
            <div className="text-sm text-gray-600">Paid Users</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.regularUsers}</div>
            <div className="text-sm text-gray-600">Regular Users</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.adminUsers}</div>
            <div className="text-sm text-gray-600">Admins</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-indigo-600">{stats.completedPayments}</div>
            <div className="text-sm text-gray-600">Payments</div>
          </div>
        </Card>
      </div>

      {usersNeedingUpgrade.length > 0 && (
        <Card className="p-6 bg-yellow-50 border-yellow-200">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            ⚠️ Users Needing Role Update
          </h2>
          <p className="text-sm text-yellow-700 mb-4">
            {usersNeedingUpgrade.length} users have completed payments but are still on &apos;user&apos; role.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {usersNeedingUpgrade.slice(0, 6).map((userData) => (
              <div key={userData.user.id} className="bg-white p-3 rounded border">
                <div className="text-sm">
                  <div className="font-medium">{userData.user.email}</div>
                  <div className="text-gray-600">
                    {userData.completedPayments} completed payment{userData.completedPayments !== 1 ? 's' : ''}
                  </div>
                  <Badge variant="outline" className="text-xs mt-1">
                    {userData.user.role}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
          {usersNeedingUpgrade.length > 6 && (
            <p className="text-sm text-yellow-700 mt-2">
              ...and {usersNeedingUpgrade.length - 6} more users
            </p>
          )}
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6">
        <Card className="overflow-hidden">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">All Users</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Role</th>
                    <th className="text-left p-2">Payments</th>
                    <th className="text-left p-2">Stripe Customer</th>
                    <th className="text-left p-2">Created</th>
                    <th className="text-left p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((userData) => (
                    <tr key={userData.user.id} className="border-b hover:bg-gray-50">
                      <td className="p-2">{userData.user.email}</td>
                      <td className="p-2">
                        <Badge 
                          variant={userData.user.role === 'admin' ? 'default' : 
                                   userData.user.role === 'paiduser' ? 'secondary' : 'outline'}
                          className="text-xs"
                        >
                          {userData.user.role === 'paiduser' ? 'Paid User' : 
                           userData.user.role === 'admin' ? 'Admin' : 'Regular User'}
                        </Badge>
                      </td>
                      <td className="p-2">{userData.completedPayments}</td>
                      <td className="p-2">
                        {userData.user.stripeCustomerId ? 
                          <Badge variant="outline" className="text-xs">Connected</Badge> : 
                          '-'
                        }
                      </td>
                      <td className="p-2">
                        {new Date(userData.user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-2">
                        {userData.completedPayments > 0 && userData.user.role === 'user' ? (
                          <Badge variant="destructive" className="text-xs">
                            Needs Upgrade
                          </Badge>
                        ) : userData.completedPayments > 0 ? (
                          <Badge className="text-xs bg-green-100 text-green-800">
                            Paid
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">
                            Free
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}