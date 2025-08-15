"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Search, 
  CreditCard, 
  MoreHorizontal, 
  Edit, 
  Ban, 
  CheckCircle,
  DollarSign,
  Calendar as CalendarIcon,
  Building2,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  ChevronsUpDown,
  Check,
  Calendar1,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Calendar as DateCalendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { subscriptionApi } from "@/lib/api";
import Link from "next/link";

// Loading skeleton component
function SubscriptionTableSkeleton() {
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

function getStatusBadge(status) {
  const variants = {
    Active: "bg-green-100 text-green-800 hover:bg-green-100",
    Suspended: "bg-red-100 text-red-800 hover:bg-red-100",
    "Expiring Soon": "bg-yellow-100 text-yellow-800 hover:bg-yellow-100",
    Expired: "bg-gray-100 text-gray-800 hover:bg-gray-100"
  };
  
  return (
    <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
      {status}
    </Badge>
  );
}

function getPlanBadge(plan) {
  const variants = {
    Standard: "bg-blue-100 text-blue-800 hover:bg-blue-100"
  };
  
  return (
    <Badge variant="outline" className={variants[plan] || "bg-gray-100 text-gray-800"}>
      {plan || 'Standard'}
    </Badge>
  );
}

function UsageProgress({ current, limit, label }) {
  const percentage = Math.min((current / limit) * 100, 100);
  const isNearLimit = percentage > 80;
  
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className={isNearLimit ? "text-orange-600" : "text-muted-foreground"}>
          {current.toLocaleString()} / {limit.toLocaleString()}
        </span>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isNearLimit ? "bg-orange-100" : ""}`}
      />
    </div>
  );
}

export default function SubscriptionsPage() {
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [isStatusFilterOpen, setIsStatusFilterOpen] = useState(false);
  const [isPlanFilterOpen, setIsPlanFilterOpen] = useState(false);
  const [statusOpenId, setStatusOpenId] = useState(null);
  const [dateOpenId, setDateOpenId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const params = {
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter !== "all" ? statusFilter : undefined,
        plan: planFilter !== "all" ? planFilter : undefined
      };

      const response = await subscriptionApi.getSubscriptions(params);
      
      if (response.success) {
        setSubscriptionData(response.data);
        setPagination(response.data.pagination || pagination);
      } else {
        setError('Failed to load subscription data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, statusFilter, planFilter]);

  const statusOptions = [
    { value: "all", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "expiring_soon", label: "Expiring Soon" },
    { value: "suspended", label: "Suspended" },
    { value: "expired", label: "Expired" }
  ];

  const planOptions = [
    { value: "all", label: "All Plans" },
    { value: "standard", label: "Standard" }
  ];

  const handleInlineStatusChange = async (subscription, label) => {
    try {
      setUpdatingId(subscription.id);
      // Map UI label to backend action/data
      const lower = label.toLowerCase();
      if (lower === 'active') {
        await handleSubscriptionAction(subscription.id, 'activate');
      } else if (lower === 'suspended') {
        await handleSubscriptionAction(subscription.id, 'suspend');
      } else if (lower === 'expired') {
        const past = new Date();
        past.setDate(past.getDate() - 1);
        await handleSubscriptionAction(subscription.id, 'edit', { subscriptionExpiresAt: past.toISOString() });
      } else if (lower === 'expiring soon' || lower === 'expiring_soon') {
        const soon = new Date();
        soon.setDate(soon.getDate() + 7);
        await handleSubscriptionAction(subscription.id, 'edit', { subscriptionExpiresAt: soon.toISOString() });
      }
    } finally {
      setUpdatingId(null);
      setStatusOpenId(null);
    }
  };

  const handleInlineRenewalDate = async (subscription, date) => {
    if (!date) return;
    try {
      setUpdatingId(subscription.id);
      await handleSubscriptionAction(subscription.id, 'edit', { subscriptionExpiresAt: date.toISOString() });
    } finally {
      setUpdatingId(null);
      setDateOpenId(null);
    }
  };

  const handleSubscriptionAction = async (subscriptionId, action, data = {}) => {
    try {
      const response = await subscriptionApi.updateSubscription(subscriptionId, {
        action,
        ...data
      });
      
      if (response.success) {
        // Refresh subscription data
        fetchSubscriptionData();
      } else {
        alert('Failed to update subscription: ' + response.error);
      }
    } catch (err) {
      alert('Error updating subscription: ' + err.message);
    }
  };

  useEffect(() => {
    fetchSubscriptionData();
  }, [pagination.page, statusFilter, planFilter]);

  // Debounced search
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (pagination.page === 1) {
        fetchSubscriptionData();
      } else {
        setPagination(prev => ({ ...prev, page: 1 }));
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const filteredSubscriptions = subscriptionData?.subscriptions || [];

  // Derived stats from current dataset (page)
  const monthlyRevenueSum = filteredSubscriptions.reduce((sum, sub) => sum + (sub.monthlyRevenue || 0), 0);
  const activeCount = filteredSubscriptions.filter(sub => sub.status === 'Active').length;
  const expiringSoonCount = filteredSubscriptions.filter(sub => sub.status === 'Expiring Soon').length;
  // Treat expired as suspended for display purposes
  const suspendedCount = filteredSubscriptions.filter(sub => sub.status === 'Expired').length;

  // Plan distribution derived from current dataset
  const planMap = filteredSubscriptions.reduce((acc, sub) => {
    const name = (sub.subscriptionPlan || 'Standard');
    if (!acc[name]) acc[name] = { name, count: 0, revenue: 0 };
    acc[name].count += 1;
    acc[name].revenue += (sub.monthlyRevenue || 0);
    return acc;
  }, {});
  const totalPlansCount = filteredSubscriptions.length || 0;
  const planDistributionArr = Object.values(planMap).map(p => ({
    ...p,
    percentage: totalPlansCount ? (p.count / totalPlansCount) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-teal-600 via-cyan-600 to-blue-600 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-green-500/20 rounded-tr-full"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight mb-2">Subscription Management</h1>
          <p className="text-teal-100 text-lg">
            Monitor and manage all organization subscriptions and billing
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600"></div>
          <div className="relative bg-white/10 backdrop-blur-sm h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-100">Monthly Revenue (Orgs)</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-24 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">₨{monthlyRevenueSum.toLocaleString()}</p>
                  )}
                  <p className="text-xs text-green-100 mt-1">Aggregated from registered invoices this month</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600"></div>
          <div className="relative bg-white/10 backdrop-blur-sm h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-100">Active Subscriptions</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{activeCount}</p>
                  )}
                  <p className="text-xs text-blue-100 mt-1">Currently active organizations</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600"></div>
          <div className="relative bg-white/10 backdrop-blur-sm h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-100">Expiring Soon</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{expiringSoonCount}</p>
                  )}
                  <p className="text-xs text-orange-100 mt-1">Requires attention</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <AlertTriangle className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
        
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-red-600"></div>
          <div className="relative bg-white/10 backdrop-blur-sm h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-100">Suspended</p>
                  {isLoading ? (
                    <div className="animate-pulse bg-white/20 h-8 w-16 rounded"></div>
                  ) : (
                    <p className="text-2xl font-bold text-white">{suspendedCount}</p>
                  )}
                  <p className="text-xs text-red-100 mt-1">Payment issues</p>
                </div>
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Ban className="h-5 w-5 text-white" />
                </div>
              </div>
            </CardContent>
          </div>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader>
          <CardTitle className="flex items-center text-gray-900">
            <CreditCard className="mr-2 h-5 w-5 text-teal-600" />
            All Subscriptions
          </CardTitle>
          <CardDescription>
            Complete list of organization subscriptions with billing and usage details
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organizations or plans..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Popover open={isStatusFilterOpen} onOpenChange={setIsStatusFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isStatusFilterOpen}
                  className="w-full sm:w-[200px] justify-between"
                >
                  {statusOptions.find(o => o.value === statusFilter)?.label || 'Filter by status'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-1 bg-white border shadow-lg rounded-md" align="end" sideOffset={8}>
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {statusOptions.map(opt => (
                        <CommandItem
                          key={opt.value}
                          value={opt.value}
                          onSelect={() => { setStatusFilter(opt.value); setIsStatusFilterOpen(false); }}
                          className="cursor-pointer"
                        >
                          <Check className={`mr-2 h-4 w-4 ${statusFilter === opt.value ? 'opacity-100' : 'opacity-0'}`} />
                          {opt.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            
            <Popover open={isPlanFilterOpen} onOpenChange={setIsPlanFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isPlanFilterOpen}
                  className="w-full sm:w-[200px] justify-between"
                >
                  {planOptions.find(o => o.value === planFilter)?.label || 'Filter by plan'}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[220px] p-1 bg-white border shadow-lg rounded-md" align="end" sideOffset={8}>
                <Command>
                  <CommandList>
                    <CommandGroup>
                      {planOptions.map(opt => (
                        <CommandItem
                          key={opt.value}
                          value={opt.value}
                          onSelect={() => { setPlanFilter(opt.value); setIsPlanFilterOpen(false); }}
                          className="cursor-pointer"
                        >
                          <Check className={`mr-2 h-4 w-4 ${planFilter === opt.value ? 'opacity-100' : 'opacity-0'}`} />
                          {opt.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Subscriptions Table */}
          <div className="rounded-md border">
            {isLoading ? (
              <SubscriptionTableSkeleton />
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-red-600">{error}</p>
                <Button onClick={fetchSubscriptionData} className="mt-4" variant="outline">
                  Retry
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Plan & Billing</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Renewal Date</TableHead>
                    <TableHead>Revenue</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                {filteredSubscriptions.map((subscription) => (
                  <TableRow key={subscription.id} className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-colors">
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">{subscription.organizationName || 'Unknown Organization'}</span>
                        <div className="flex items-center text-xs text-muted-foreground mt-1">
                          <Building2 className="h-3 w-3 mr-1" />
                          ID: {subscription.organizationId}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-1">
                        {getPlanBadge(subscription.plan || 'Standard')}
                        <div className="text-sm font-medium">₨{(subscription.monthlyRevenue || 0).toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">Monthly</div>
                        <div className="text-xs text-muted-foreground">Auto-billing</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 min-w-[150px]">
                        <UsageProgress 
                          current={subscription.userCount || 0}
                          limit={subscription.userLimit || 10}
                          label="Users"
                        />
                        <UsageProgress 
                          current={subscription.invoiceCount || 0}
                          limit={subscription.invoiceLimit || 1000}
                          label="Invoices"
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col space-y-2 min-w-[180px]">
                        <div className="flex items-center gap-2">
                          {getStatusBadge(subscription.status || 'Active')}
                          <Popover open={statusOpenId === subscription.id} onOpenChange={(open) => setStatusOpenId(open ? subscription.id : null)}>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="outline" disabled={updatingId === subscription.id} className="h-7 px-2">
                                {subscription.status || 'Active'}
                                <ChevronsUpDown className="ml-1 h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-1 bg-white border shadow-lg rounded-md" align="start" sideOffset={6}>
                              <Command>
                                <CommandList>
                                  <CommandGroup>
                                    {['Active','Expiring Soon','Suspended','Expired'].map(label => (
                                      <CommandItem
                                        key={label}
                                        value={label}
                                        onSelect={() => handleInlineStatusChange(subscription, label)}
                                        className="cursor-pointer"
                                      >
                                        <Check className={`mr-2 h-4 w-4 ${subscription.status === label ? 'opacity-100' : 'opacity-0'}`} />
                                        {label}
                                      </CommandItem>
                                    ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Auto-renew: {subscription.autoRenew ? "On" : "Off"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-2 min-w-[180px]">
                        <div className="flex items-center gap-2 text-sm">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                          <Popover open={dateOpenId === subscription.id} onOpenChange={(open) => setDateOpenId(open ? subscription.id : null)}>
                            <PopoverTrigger asChild>
                              <Button size="sm" variant="outline" disabled={updatingId === subscription.id} className="h-7 px-2">
                                {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Set renewal date'}
                                <ChevronsUpDown className="ml-1 h-3 w-3" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="p-2 bg-white border shadow-lg rounded-md" align="start" sideOffset={6}>
                              <DateCalendar
                                mode="single"
                                selected={subscription.expiresAt ? new Date(subscription.expiresAt) : undefined}
                                onSelect={(date) => handleInlineRenewalDate(subscription, date)}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Started: {subscription.createdAt ? new Date(subscription.createdAt).toLocaleDateString() : 'Unknown'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium">₨{(subscription.totalRevenue || 0).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">Total revenue</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 transition-all duration-200">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-64 bg-white/95 backdrop-blur-md border-0 shadow-xl rounded-xl p-2">
                          <DropdownMenuLabel className="text-gray-900 font-semibold text-sm px-3 py-2 bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg mb-1">
                            Subscription Actions
                          </DropdownMenuLabel>
                          <DropdownMenuItem asChild className="rounded-lg mb-1 focus:bg-gradient-to-r focus:from-blue-50 focus:to-blue-100 transition-all duration-200">
                            <Link href={`/admin/subscriptions/${subscription.id}/edit`} className="flex items-center px-3 py-2 text-gray-700 hover:text-blue-700">
                              <Edit className="mr-3 h-4 w-4 text-blue-600" />
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-700">Edit Subscription</span>
                                <span className="text-xs text-gray-500">Modify subscription details</span>
                              </div>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="rounded-lg mb-1 focus:bg-gradient-to-r focus:from-green-50 focus:to-green-100 transition-all duration-200"
                            onClick={() => handleSubscriptionAction(subscription.id, 'renew')}
                          >
                            <RefreshCw className="mr-3 h-4 w-4 text-green-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700">Renew Now</span>
                              <span className="text-xs text-gray-500">Immediately renew subscription</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="rounded-lg mb-1 focus:bg-gradient-to-r focus:from-purple-50 focus:to-purple-100 transition-all duration-200"
                            onClick={() => handleSubscriptionAction(subscription.id, 'upgrade')}
                          >
                            <TrendingUp className="mr-3 h-4 w-4 text-purple-600" />
                            <div className="flex flex-col">
                              <span className="font-medium text-gray-700">Upgrade Plan</span>
                              <span className="text-xs text-gray-500">Move to a higher plan</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="bg-gradient-to-r from-gray-200 to-gray-100 h-px my-2" />
                          <DropdownMenuItem 
                            className="rounded-lg mb-1 focus:bg-gradient-to-r focus:from-orange-50 focus:to-orange-100 transition-all duration-200 text-orange-600 hover:text-orange-700"
                            onClick={() => handleSubscriptionAction(subscription.id, 'suspend')}
                          >
                            <Ban className="mr-3 h-4 w-4 text-orange-500" />
                            <div className="flex flex-col">
                              <span className="font-medium">Suspend</span>
                              <span className="text-xs text-orange-400">Temporarily pause subscription</span>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="rounded-lg focus:bg-gradient-to-r focus:from-red-50 focus:to-red-100 transition-all duration-200 text-red-600 hover:text-red-700"
                            onClick={() => {
                              if (confirm(`Are you sure you want to cancel the subscription for ${subscription.organizationName}?`)) {
                                handleSubscriptionAction(subscription.id, 'cancel');
                              }
                            }}
                          >
                            <Ban className="mr-3 h-4 w-4 text-red-500" />
                            <div className="flex flex-col">
                              <span className="font-medium">Cancel Subscription</span>
                              <span className="text-xs text-red-400">Permanently cancel subscription</span>
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
              

          {!isLoading && !error && filteredSubscriptions.length === 0 && (
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                  <CreditCard className="h-8 w-8 text-gray-400" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No Subscriptions Found</h3>
                  <p className="text-gray-500">
                    {searchTerm || statusFilter !== "all" || planFilter !== "all"
                      ? "No subscriptions match your search criteria. Try adjusting your filters."
                      : "There are no active subscriptions in the system yet."
                    }
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !error && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} subscriptions
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

      {/* Revenue Analytics */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-600" />
              Subscription Distribution
            </CardTitle>
            <CardDescription>
              Breakdown of active subscriptions by plan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded mb-1"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>
                ))
              ) : (
                planDistributionArr.length > 0 ? (
                  planDistributionArr.map((plan) => (
                    <div key={plan.name} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          {getPlanBadge(plan.name)}
                          <span className="text-sm font-medium">{plan.count} organizations</span>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ₨{(plan.revenue || 0).toLocaleString()}/month
                        </span>
                      </div>
                      <Progress value={plan.percentage || 0} className="h-2" />
                      <div className="text-xs text-muted-foreground">
                        {(plan.percentage || 0).toFixed(1)}% of active subscriptions
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">No subscription data available</p>
                  </div>
                )
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Calendar1 className="mr-2 h-5 w-5 text-orange-600" />
              Upcoming Renewals
            </CardTitle>
            <CardDescription>
              Subscriptions expiring in the next 30 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="animate-pulse p-4 bg-gray-100 rounded-lg">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                ))
              ) : Array.isArray(subscriptionData?.upcomingRenewals) && subscriptionData.upcomingRenewals.length > 0 ? (
                subscriptionData.upcomingRenewals.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-100 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex flex-col">
                      <span className="font-medium text-sm text-gray-900">{sub.organizationName || 'Unknown Organization'}</span>
                      <div className="flex items-center space-x-2 mt-1">
                        {getPlanBadge(sub.plan || 'Standard')}
                        <span className="text-xs text-orange-600">
                          {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString() : 'No expiry'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-900">₨{(sub.monthlyRevenue || 0).toLocaleString()}</span>
                      {!sub.autoRenew && (
                        <AlertTriangle className="h-4 w-4 text-orange-500" />
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No upcoming renewals in the next 30 days</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}