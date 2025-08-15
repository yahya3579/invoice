"use client";

import { useState, useEffect } from "react";
import { 
  Search, 
  Building2, 
  Users, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Plus,
  DollarSign,
  Calendar,
  Activity
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
import { organizationApi } from "@/lib/api";

// Loading skeleton component
function OrganizationTableSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
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

function getBusinessTypeBadge(businessType) {
  const variants = {
    product: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    service: "bg-green-100 text-green-800 hover:bg-green-100"
  };
  
  return (
    <Badge className={variants[businessType] || "bg-gray-100 text-gray-800"}>
      {businessType ? businessType.charAt(0).toUpperCase() + businessType.slice(1) : 'Unknown'}
    </Badge>
  );
}

function getSubscriptionBadge(subscription) {
  const variants = {
    Standard: "bg-blue-100 text-blue-800 hover:bg-blue-100"
  };
  
  return (
    <Badge variant="outline" className={variants[subscription] || "bg-gray-100 text-gray-800"}>
      {subscription || 'Standard'}
    </Badge>
  );
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [totals, setTotals] = useState({ totalRevenueAll: 0, totalInvoicesAll: 0 });

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
        subscription: subscriptionFilter !== "all" ? subscriptionFilter : undefined
      };

      const response = await organizationApi.getOrganizations(params);
      
      if (response.success) {
        setOrganizations(response.data.organizations);
        setPagination(response.data.pagination);
        if (response.data.totals) {
          setTotals({
            totalRevenueAll: Number(response.data.totals.totalRevenueAll || 0),
            totalInvoicesAll: Number(response.data.totals.totalInvoicesAll || 0),
          });
        }
      } else {
        setError('Failed to load organizations');
      }
    } catch (err) {
      setError(err.message || 'Failed to load organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteOrganization = async (orgId, orgName) => {
    if (!confirm(`Are you sure you want to delete organization "${orgName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const response = await organizationApi.deleteOrganization(orgId);
      if (response.success) {
        // Refresh organizations list
        fetchOrganizations();
      } else {
        alert('Failed to delete organization: ' + response.error);
      }
    } catch (err) {
      alert('Error deleting organization: ' + err.message);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [pagination.page, statusFilter, subscriptionFilter]);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchOrganizations();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const filteredOrganizations = organizations; // API handles filtering

  // Calculate stats (users still from current page; revenue/invoices from API totals)
  const totalUsers = organizations.reduce((sum, org) => sum + (org.userCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-700 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-pink-500/20 rounded-tr-full"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Organizations Management</h1>
            <p className="text-purple-100 text-lg">
              Manage all organizations using the TXS Invoice system
            </p>
          </div>
          <Button asChild className="sm:w-auto bg-white text-purple-700 hover:bg-purple-50 shadow-lg">
            <Link href="/admin/organizations/create">
              <Plus className="mr-2 h-4 w-4" />
              Add Organization
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
                <p className="text-sm font-medium text-blue-100">Total Organizations</p>
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{pagination.total}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-green-100">Total Users</p>
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{totalUsers}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-purple-100">Total Revenue</p>
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-20 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">₨{Number(totals.totalRevenueAll || 0).toLocaleString()}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-lg border-0 bg-gradient-to-br from-orange-500 to-orange-600 text-white overflow-hidden">
          <CardContent className="p-6 relative">
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full transform translate-x-6 -translate-y-6"></div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-orange-100">Total Invoices</p>
                {isLoading ? (
                  <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                ) : (
                  <p className="text-3xl font-bold">{Number(totals.totalInvoicesAll || 0).toLocaleString()}</p>
                )}
              </div>
              <div className="h-12 w-12 bg-white/20 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations List */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations List</CardTitle>
          <CardDescription>
            Comprehensive list of all registered organizations with their details and status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
                         <div className="relative flex-1">
               <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-purple-500" />
               <Input
                 placeholder="Search organizations, industries, or contacts..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="pl-9 bg-white border border-gray-200 hover:border-purple-300 focus:border-purple-500 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md focus:shadow-lg"
               />
             </div>
            
                         <Select value={statusFilter} onValueChange={setStatusFilter}>
               <SelectTrigger className="w-full sm:w-[180px] bg-white border border-gray-200 hover:border-purple-300 focus:border-purple-500 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md">
                 <SelectValue placeholder="Filter by status" />
               </SelectTrigger>
               <SelectContent className="z-[9999] bg-white/98 backdrop-blur-md border border-gray-200/50 shadow-2xl rounded-xl">
                 <SelectItem value="all" className="hover:bg-purple-50 focus:bg-purple-100 rounded-lg mx-1 my-0.5">All Status</SelectItem>
                 <SelectItem value="active" className="hover:bg-green-50 focus:bg-green-100 rounded-lg mx-1 my-0.5">Active</SelectItem>
                 <SelectItem value="suspended" className="hover:bg-yellow-50 focus:bg-yellow-100 rounded-lg mx-1 my-0.5">Suspended</SelectItem>
                 <SelectItem value="inactive" className="hover:bg-red-50 focus:bg-red-100 rounded-lg mx-1 my-0.5">Inactive</SelectItem>
               </SelectContent>
             </Select>
             
             <Select value={subscriptionFilter} onValueChange={setSubscriptionFilter}>
               <SelectTrigger className="w-full sm:w-[180px] bg-white border border-gray-200 hover:border-purple-300 focus:border-purple-500 transition-all duration-200 rounded-lg shadow-sm hover:shadow-md">
                 <SelectValue placeholder="Filter by plan" />
               </SelectTrigger>
               <SelectContent className="z-[9999] bg-white/98 backdrop-blur-md border border-gray-200/50 shadow-2xl rounded-xl">
                 <SelectItem value="all" className="hover:bg-purple-50 focus:bg-purple-100 rounded-lg mx-1 my-0.5">All Plans</SelectItem>
                 <SelectItem value="standard" className="hover:bg-blue-50 focus:bg-blue-100 rounded-lg mx-1 my-0.5">Standard</SelectItem>
               </SelectContent>
             </Select>
          </div>

          {/* Organizations Table */}
          <div className="rounded-md border">
            {isLoading ? (
              <OrganizationTableSkeleton />
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchOrganizations} className="mt-4" variant="outline">
                  Retry
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Business Type</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Subscription</TableHead>
                    <TableHead>Monthly Revenue</TableHead>
                    {/* <TableHead>Total Revenue</TableHead> */}
                    <TableHead>Invoices</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{org.name}</span>
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Building2 className="h-3 w-3 mr-1" />
                            {org.address || 'No address provided'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            NTN: {org.ntn}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-xs text-muted-foreground">{org.email || 'No email'}</span>
                          <span className="text-xs text-muted-foreground">{org.phone || 'No phone'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getBusinessTypeBadge(org.businessType)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{org.userCount || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getSubscriptionBadge(org.subscriptionPlan || 'Standard')}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">₨{(org.monthlyRevenue || 0).toLocaleString()}</span>
                      </TableCell>
                      {/* <TableCell>
                        <span className="font-medium">₨{(org.totalRevenue || 0).toLocaleString()}</span>
                      </TableCell> */}
                      <TableCell>
                        <div className="flex items-center">
                          <Activity className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm">{(org.invoiceCount || 0).toLocaleString()}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                                                     <DropdownMenuTrigger asChild>
                             <Button 
                               variant="ghost" 
                               className="h-9 w-9 p-0 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all duration-200 rounded-lg border border-gray-200/50 hover:border-purple-200 hover:shadow-md"
                             >
                               <span className="sr-only">Open menu</span>
                               <MoreHorizontal className="h-4 w-4 text-gray-600" />
                             </Button>
                           </DropdownMenuTrigger>
                           <DropdownMenuContent 
                             align="end" 
                             className="w-72 bg-white/98 backdrop-blur-md border border-gray-200/50 shadow-2xl rounded-2xl p-3 z-50"
                             sideOffset={8}
                           >
                                                         <DropdownMenuLabel className="text-gray-900 font-semibold text-sm px-3 py-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl mb-2 border border-purple-100/50">
                               Organization Actions
                             </DropdownMenuLabel>
                             <DropdownMenuItem asChild className="rounded-xl mb-2 focus:bg-gradient-to-r focus:from-purple-50 focus:to-purple-100 transition-all duration-200 hover:shadow-sm">
                               <Link href={`/admin/organizations/${org.id}/edit`} className="flex items-center px-3 py-3 text-gray-700 hover:text-purple-700">
                                 <div className="h-8 w-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                                   <Edit className="h-4 w-4 text-purple-600" />
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="font-medium">Edit Organization</span>
                                   <span className="text-xs text-gray-500">Modify organization details</span>
                                 </div>
                               </Link>
                             </DropdownMenuItem>
                             <DropdownMenuItem asChild className="rounded-xl mb-2 focus:bg-gradient-to-r focus:from-blue-50 focus:to-blue-100 transition-all duration-200 hover:shadow-sm">
                               <Link href={`/admin/users?organization=${org.id}`} className="flex items-center px-3 py-3 text-gray-700 hover:text-blue-700">
                                 <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                                   <Users className="h-4 w-4 text-blue-600" />
                                 </div>
                                 <div className="flex flex-col">
                                   <span className="font-medium">View Users</span>
                                   <span className="text-xs text-gray-500">See all organization users</span>
                                 </div>
                               </Link>
                             </DropdownMenuItem>
                             <DropdownMenuSeparator className="bg-gradient-to-r from-gray-200 to-gray-100 h-px my-3" />
                             <DropdownMenuItem 
                               className="rounded-xl focus:bg-gradient-to-r focus:from-red-50 focus:to-red-100 transition-all duration-200 text-red-600 hover:text-red-700 hover:shadow-sm"
                               onClick={() => handleDeleteOrganization(org.id, org.name)}
                             >
                               <div className="h-8 w-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                 <Trash2 className="h-4 w-4 text-red-500" />
                               </div>
                               <div className="flex flex-col">
                                 <span className="font-medium">Delete Organization</span>
                                 <span className="text-xs text-red-400">Permanently remove organization</span>
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

          {!isLoading && !error && filteredOrganizations.length === 0 && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Organizations Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all" || subscriptionFilter !== "all"
                      ? "No organizations match your search criteria. Try adjusting your filters."
                      : "There are no organizations in the system yet."
                    }
                  </p>
                </div>
                {!searchTerm && statusFilter === "all" && subscriptionFilter === "all" && (
                  <Button asChild className="mt-4">
                    <Link href="/admin/organizations/create">
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Organization
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
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} organizations
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