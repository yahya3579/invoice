"use client";

import { useState, useEffect } from "react";
import { 
  Users, 
  Building2, 
  CreditCard, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  DollarSign,
  Package,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { adminDashboardApi } from "@/lib/api";

function StatCard({ stat, isLoading }) {
  const IconComponent = stat.icon;
  
  const cardColors = {
    'Total Users': 'bg-gradient-to-br from-blue-500 to-blue-600',
    'Organizations': 'bg-gradient-to-br from-purple-500 to-purple-600', 
    'Active Subscriptions': 'bg-gradient-to-br from-green-500 to-green-600',
    'Monthly Revenue': 'bg-gradient-to-br from-orange-500 to-orange-600',
    'FBR Transactions': 'bg-gradient-to-br from-pink-500 to-pink-600',
    'Invoice Generated': 'bg-gradient-to-br from-indigo-500 to-indigo-600'
  };
  
  const cardColor = cardColors[stat.title] || 'bg-gradient-to-br from-gray-500 to-gray-600';
  
  if (isLoading) {
    return (
      <Card className="relative overflow-hidden border-0 shadow-lg">
        <div className={`absolute inset-0 ${cardColor}`}>
          <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
        </div>
        <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="animate-pulse bg-white/20 h-4 w-20 rounded"></div>
          <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
            <div className="animate-pulse bg-white/20 h-5 w-5 rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="relative">
          <div className="animate-pulse bg-white/20 h-8 w-24 rounded mb-2"></div>
          <div className="animate-pulse bg-white/20 h-4 w-32 rounded"></div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
      <div className={`absolute inset-0 ${cardColor}`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
      </div>
      <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-white">
          {stat.title}
        </CardTitle>
        <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
          <IconComponent className="h-5 w-5 text-white" />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
        <div className="flex items-center space-x-2 text-xs text-white/90 mt-1">
          <span 
            className={`flex items-center px-2 py-1 rounded-full ${
              stat.changeType === 'positive' 
                ? 'bg-green-100/20 text-green-100' 
                : 'bg-red-100/20 text-red-100'
            }`}
          >
            {stat.changeType === 'positive' ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {stat.change}
          </span>
          <span className="text-white/70">from last month</span>
        </div>
        <p className="text-xs text-white/80 mt-2">
          {stat.description}
        </p>
      </CardContent>
    </Card>
  );
}

function getStatusBadge(status) {
  const variants = {
    Active: "bg-green-100 text-green-800 hover:bg-green-100",
    Pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    Suspended: "bg-red-100 text-red-800 hover:bg-red-100",
    Standard: "bg-blue-100 text-blue-800 hover:bg-blue-100"
  };
  
  return (
    <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
      {status}
    </Badge>
  );
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await adminDashboardApi.getDashboard();
      
      if (response.success) {
        setDashboardData(response.data);
      } else {
        setError('Failed to load dashboard data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Transform dashboard data into stats format
  const getTransformedStats = () => {
    if (!dashboardData) return [];

    const stats = dashboardData.stats;
    return [
      {
        title: "Total Users",
        value: stats.totalUsers?.value?.toLocaleString() || "0",
        change: stats.totalUsers?.growth ? `${stats.totalUsers.growth > 0 ? '+' : ''}${stats.totalUsers.growth.toFixed(1)}%` : "+0%",
        changeType: stats.totalUsers?.trend === 'up' ? 'positive' : 'negative',
        icon: Users,
        description: "Active registered users"
      },
      {
        title: "Organizations", 
        value: stats.totalOrganizations?.value?.toLocaleString() || "0",
        change: stats.totalOrganizations?.growth ? `${stats.totalOrganizations.growth > 0 ? '+' : ''}${stats.totalOrganizations.growth.toFixed(1)}%` : "+0%",
        changeType: stats.totalOrganizations?.trend === 'up' ? 'positive' : 'negative',
        icon: Building2,
        description: "Registered organizations"
      },
      {
        title: "Active Users",
        value: stats.activeUsers?.value?.toLocaleString() || "0",
        change: stats.activeUsers?.growth ? `${stats.activeUsers.growth > 0 ? '+' : ''}${stats.activeUsers.growth.toFixed(1)}%` : "+0%",
        changeType: stats.activeUsers?.trend === 'up' ? 'positive' : 'negative',
        icon: Activity,
        description: "Currently active users"
      },
      {
        title: "Monthly Revenue",
        value: `₨${stats.monthlyRevenue?.value?.toLocaleString() || "0"}`,
        change: stats.monthlyRevenue?.growth ? `${stats.monthlyRevenue.growth > 0 ? '+' : ''}${stats.monthlyRevenue.growth.toFixed(1)}%` : "+0%",
        changeType: stats.monthlyRevenue?.trend === 'up' ? 'positive' : 'negative',
        icon: DollarSign,
        description: "Revenue this month"
      },
      {
        title: "Total Invoices",
        value: stats.totalInvoices?.value?.toLocaleString() || "0",
        change: stats.totalInvoices?.growth ? `${stats.totalInvoices.growth > 0 ? '+' : ''}${stats.totalInvoices.growth.toFixed(1)}%` : "+0%",
        changeType: stats.totalInvoices?.trend === 'up' ? 'positive' : 'negative',
        icon: Package,
        description: "Total invoices generated"
      },
      {
        title: "Pending Users",
        value: stats.pendingUsers?.value?.toLocaleString() || "0",
        change: stats.pendingUsers?.growth ? `${stats.pendingUsers.growth > 0 ? '+' : ''}${stats.pendingUsers.growth.toFixed(1)}%` : "+0%",
        changeType: stats.pendingUsers?.trend === 'down' ? 'positive' : 'negative', // Reverse for pending users
        icon: CreditCard,
        description: "Users awaiting approval"
      }
    ];
  };

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center p-6">
            <AlertCircle className="h-8 w-8 text-red-600 mr-4" />
            <div>
              <h3 className="text-lg font-semibold text-red-900">Error Loading Dashboard</h3>
              <p className="text-red-700">{error}</p>
              <Button 
                onClick={fetchDashboardData} 
                className="mt-4 bg-red-600 hover:bg-red-700"
                size="sm"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-blue-900 to-purple-900 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-pink-500/20 rounded-tr-full"></div>
          <div className="absolute bottom-10 left-10 w-16 h-8 bg-green-500/20 rounded-lg transform rotate-12"></div>
          <div className="absolute bottom-5 right-10 w-24 h-12 bg-blue-500/20 rounded-lg transform -rotate-12"></div>
          <div className="absolute top-1/2 right-0 w-48 h-48 bg-slate-700/30 rounded-full transform translate-x-1/2"></div>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Dashboard Overview</h1>
            <p className="text-blue-100 text-lg">
              Welcome to your TXS Invoice Management admin dashboard. Monitor key metrics and manage your system.
            </p>
          </div>
          <Button 
            onClick={fetchDashboardData} 
            variant="outline" 
            size="sm"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30"
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {getTransformedStats().map((stat, index) => (
          <StatCard key={index} stat={stat} isLoading={isLoading} />
        ))}
      </div>

      {/* Tables Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Users */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 flex items-center">
                  <Users className="mr-2 h-5 w-5 text-blue-600" />
                  Recent Users
                </CardTitle>
                <CardDescription>
                  Latest user registrations and their status
                </CardDescription>
              </div>
              <Button asChild size="sm" className="bg-blue-600 hover:bg-blue-700 shadow-lg text-white">
                <Link href="/admin/users">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.recentUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {user.organization}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(user.status)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        {new Date(user.joinDate).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Recent Organizations */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-gray-900 flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-purple-600" />
                  Top Organizations
                </CardTitle>
                <CardDescription>
                  Organizations by revenue and activity
                </CardDescription>
              </div>
              <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 shadow-lg text-white">
                <Link href="/admin/organizations">View All</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.recentOrganizations?.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{org.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(org.subscriptionPlan || 'Standard')}
                      </TableCell>
                      <TableCell className="text-sm">
                        {org.userCount} users
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        ₨{org.invoiceCount || 0}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <Package className="mr-2 h-5 w-5 text-orange-600" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common administrative tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Button asChild className="h-auto flex-col space-y-3 p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Link href="/admin/users/create">
                <div className="p-3 bg-white/20 rounded-full">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium text-white">Create User</span>
              </Link>
            </Button>
            <Button asChild className="h-auto flex-col space-y-3 p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Link href="/admin/organizations/create">
                <div className="p-3 bg-white/20 rounded-full">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <span className="font-medium text-white">Add Organization</span>
              </Link>
            </Button>
            <Button asChild className="h-auto flex-col space-y-3 p-6 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Link href="/admin/subscriptions">
                <div className="p-3 bg-white/20 rounded-full text-white">
                  <CreditCard className="h-6 w-6" />
                </div>
                <span className="font-medium text-white">Manage Subscriptions</span>
              </Link>
            </Button>
            <Button asChild className="h-auto flex-col space-y-3 p-6 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200">
              <Link href="/admin/analytics">
                <div className="p-3 bg-white/20 rounded-full text-white">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <span className="font-medium text-white">View Analytics</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}