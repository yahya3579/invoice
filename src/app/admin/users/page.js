"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  UserPlus,
  Mail,
  Phone,
  Building,
  Calendar,
  Users
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { userApi } from "@/lib/api";

// Loading skeleton component
function UserTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="animate-pulse flex space-x-4 p-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
          <div className="h-4 bg-gray-200 rounded w-20"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
      ))}
    </div>
  );
}
// Removed mock data - now using API

function getStatusBadge(status) {
  const variants = {
    Active: "bg-green-100 text-green-800 hover:bg-green-100",
    Pending: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    Suspended: "bg-red-100 text-red-800 hover:bg-red-100"
  };
  
  return (
    <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
      {status}
    </Badge>
  );
}

function getRoleBadge(role) {
  const variants = {
    Admin: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    Manager: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    User: "bg-gray-100 text-gray-800 hover:bg-gray-100"
  };
  
  return (
    <Badge variant="outline" className={variants[role]}>
      {role}
    </Badge>
  );
}

function getSubscriptionBadge(subscription) {
  const variants = {
    active: "bg-green-100 text-green-800 hover:bg-green-100",
    inactive: "bg-gray-100 text-gray-800 hover:bg-gray-100",
    expired: "bg-red-100 text-red-800 hover:bg-red-100"
  };
  
  return (
    <Badge variant="outline" className={variants[subscription] || "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
      {subscription}
    </Badge>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("user"); // Fixed to user role only
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
        role: "user" // Always filter to only show user role (lowercase to match Prisma enum)
      };

      const response = await userApi.getUsers(params);
      
      if (response.success) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        setError('Failed to load users');
      }
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await userApi.deleteUser(userId);
      if (response.success) {
        // Refresh users list
        fetchUsers();
      } else {
        alert('Failed to delete user: ' + response.error);
      }
    } catch (err) {
      alert('Error deleting user: ' + err.message);
    }
  };

  useEffect(() => {
    // Reset to first page when filters change
    if (pagination.page !== 1) {
      setPagination(prev => ({ ...prev, page: 1 }));
    } else {
      fetchUsers();
    }
  }, [statusFilter]); // Only depend on statusFilter

  // Separate useEffect for pagination changes
  useEffect(() => {
    if (pagination.page > 1) {
      fetchUsers();
    }
  }, [pagination.page]);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchUsers();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const filteredUsers = users; // API handles filtering

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-pink-500/20 rounded-tr-full"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Regular Users Management</h1>
            <p className="text-blue-100 text-lg">
              Manage regular users (non-admin) and their access to the TXS Invoice system
            </p>
          </div>
          <Button asChild className="sm:w-auto bg-white text-blue-700 hover:bg-blue-50 shadow-lg">
            <Link href="/admin/users/create">
              <UserPlus className="mr-2 h-4 w-4" />
              Create User
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-blue-100">Total Users</p>
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{pagination.total}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-green-100">Active Users</p>
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{users.filter(u => u.isActive).length}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-br from-yellow-500 to-orange-500 text-white overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-yellow-100">Pending Users</p>
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{users.filter(u => !u.isActive).length}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-purple-100">Regular Users</p>
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{pagination.total}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Building className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <Users className="mr-2 h-5 w-5 text-blue-600" />
            Users List
          </CardTitle>
          <CardDescription>
            A comprehensive list of all registered users with their details and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users, emails, or organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px] border-gray-200 focus:border-blue-500 focus:ring-blue-500 transition-all duration-200 bg-white hover:bg-gray-50">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-white/95 backdrop-blur-md border-0 shadow-xl rounded-xl p-2 min-w-[200px]">
                <SelectItem value="all" className="rounded-lg hover:bg-blue-50 focus:bg-blue-50 transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                    <span>All Status</span>
                  </div>
                </SelectItem>
                <SelectItem value="active" className="rounded-lg hover:bg-green-50 focus:bg-green-50 transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Active</span>
                  </div>
                </SelectItem>
                <SelectItem value="pending" className="rounded-lg hover:bg-yellow-50 focus:bg-yellow-50 transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span>Pending</span>
                  </div>
                </SelectItem>
                <SelectItem value="suspended" className="rounded-lg hover:bg-red-50 focus:bg-red-50 transition-colors duration-200">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Suspended</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filter Indicator */}
          {statusFilter !== "all" && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-blue-700">
                  Showing {statusFilter} users only
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Clear Filter
                </Button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="rounded-md border">
            {isLoading ? (
              <UserTableSkeleton />
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchUsers} className="mt-4" variant="outline">
                  Retry
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-blue-50 border-b-2 border-gray-200">
                    <TableHead className="font-semibold text-gray-900">User</TableHead>
                    <TableHead className="font-semibold text-gray-900">Organization</TableHead>
                    <TableHead className="font-semibold text-gray-900">FBR Token</TableHead>
                    <TableHead className="font-semibold text-gray-900">Role</TableHead>
                    <TableHead className="font-semibold text-gray-900">Status</TableHead>
                    <TableHead className="font-semibold text-gray-900">Subscription</TableHead>
                    <TableHead className="font-semibold text-gray-900">Last Active</TableHead>
                    <TableHead className="text-right font-semibold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 border-b border-gray-100">
                      <TableCell className="py-4">
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{user.name}</span>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Mail className="h-3 w-3 mr-1" />
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-gray-700">{user.organizationName || 'No Organization'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-4">
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs font-mono text-gray-700 border border-gray-200">
                          {user.fbrToken || 'Not Set'}
                        </code>
                      </TableCell>
                      <TableCell className="py-4">
                        {getRoleBadge(user.role)}
                      </TableCell>
                      <TableCell className="py-4">
                        {getStatusBadge(user.isActive ? 'Active' : 'Inactive')}
                      </TableCell>
                      <TableCell className="py-4">
                        {getSubscriptionBadge(user.subscriptionPlan || 'None')}
                      </TableCell>
                      <TableCell className="py-4 text-sm text-gray-600">
                        {new Date(user.lastActive).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="py-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 rounded-lg">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-md border-0 shadow-xl rounded-xl p-2 animate-in fade-in-0 zoom-in-95 duration-200">
                            <DropdownMenuLabel className="text-gray-900 font-semibold text-sm px-3 py-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg mb-1">
                              User Actions
                            </DropdownMenuLabel>
                            <DropdownMenuItem asChild className="rounded-lg mb-1 focus:bg-gradient-to-r focus:from-blue-50 focus:to-blue-100 transition-all duration-200 hover:shadow-sm">
                              <Link href={`/admin/users/${user.id}`} className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-700">
                                <Edit className="mr-3 h-4 w-4 text-blue-600" />
                                <div className="flex flex-col">
                                  <span className="font-medium">Edit User</span>
                                  <span className="text-xs text-gray-500">Modify user details and permissions</span>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gradient-to-r from-gray-200 to-gray-100 h-px my-2" />
                            <DropdownMenuItem 
                              className="rounded-lg focus:bg-gradient-to-r focus:from-red-50 focus:to-red-100 transition-all duration-200 text-red-600 hover:text-red-700 hover:shadow-sm"
                              onClick={() => handleDeleteUser(user.id, user.name)}
                            >
                              <Trash2 className="mr-3 h-4 w-4 text-red-500" />
                              <div className="flex flex-col">
                                <span className="font-medium">Delete User</span>
                                <span className="text-xs text-red-400">Permanently remove this user</span>
                              </div>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {!isLoading && !error && filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Users className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Users Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all" 
                      ? "No regular users match your search criteria. Try adjusting your filters."
                      : "There are no regular users in the system yet."
                    }
                  </p>
                </div>
                {!searchTerm && statusFilter === "all" && (
                  <Button asChild className="mt-4">
                    <Link href="/admin/users/create">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Add First User
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}