"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  Download, 
  TrendingUp, 
  TrendingDown,
  Users,
  Building2,
  DollarSign,
  Activity,
  BarChart3,
  PieChart,
  FileBarChart,
  ChevronsUpDown,
  Check
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Command, 
  CommandGroup, 
  CommandItem, 
  CommandList
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Pie
} from "recharts";
import { analyticsApi } from "@/lib/api";

// Removed mock data - now using API

function StatCard({ title, value, change, changeType, icon: Icon, description }) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center space-x-1 text-xs mt-1">
              {changeType === 'positive' ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span 
                className={`font-medium ${
                  changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {change}
              </span>
              <span className="text-muted-foreground">vs last month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{description}</p>
          </div>
          <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Icon className="h-6 w-6 text-blue-600" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border rounded-lg shadow-lg">
        <p className="font-medium">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {`${entry.dataKey}: ${typeof entry.value === 'number' ? entry.value.toLocaleString() : entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState("6months");
  const [selectedMetric, setSelectedMetric] = useState("revenue");
  const [derived, setDerived] = useState({
    revenueData: [],
    userGrowthData: [],
    subscriptionDistribution: [],
    industryData: [],
    invoiceData: [],
    topOrganizations: [],
  });
  const [isTimeOpen, setIsTimeOpen] = useState(false);

  const timeOptions = [
    { value: "1month", label: "Last Month" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "1year", label: "Last Year" },
  ];

  const fetchAnalyticsData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Map UI timeRange to backend params (period or date range)
      const params = {};
      const now = new Date();
      if (timeRange === "1month") {
        params.period = "month";
      } else if (timeRange === "1year") {
        params.period = "year";
      } else if (timeRange === "3months" || timeRange === "6months") {
        const days = timeRange === "3months" ? 90 : 180;
        const start = new Date(now);
        start.setDate(start.getDate() - days);
        params.startDate = start.toISOString();
        params.endDate = now.toISOString();
      } else {
        params.period = "month";
      }

      const response = await analyticsApi.getAnalytics(params);
      
      if (response.success) {
        const d = response.data;
        setAnalyticsData(d);

        // Build revenue series from recent invoices (registered only)
        const invoices = d.recentActivity?.invoices || [];
        const monthKey = (dateStr) => {
          const dt = new Date(dateStr);
          return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`;
        };
        const monthLabel = (key) => {
          const [y, m] = key.split('-');
          return new Date(Number(y), Number(m) - 1, 1).toLocaleString(undefined, { month: 'short', year: 'numeric' });
        };
        const revenueMap = new Map();
        invoices.filter(inv => inv.status === 'registered').forEach(inv => {
          const key = monthKey(inv.createdAt);
          const amount = parseFloat(inv.totalAmount || 0);
          revenueMap.set(key, (revenueMap.get(key) || 0) + amount);
        });
        const revenueData = Array.from(revenueMap.entries())
          .sort(([a],[b]) => a.localeCompare(b))
          .map(([k,v]) => ({ month: monthLabel(k), revenue: v }));

        // Build user growth from recent users
        const users = (d.recentActivity?.users || []).filter(u => u.role === 'user');
        const userMap = new Map();
        const activeMap = new Map();
        users.forEach(u => {
          const key = monthKey(u.createdAt);
          userMap.set(key, (userMap.get(key) || 0) + 1);
          if (u.isActive) activeMap.set(key, (activeMap.get(key) || 0) + 1);
        });
        const keysAll = Array.from(new Set([...userMap.keys(), ...activeMap.keys()])).sort();
        const userGrowthData = keysAll.map(k => ({
          month: monthLabel(k),
          newUsers: userMap.get(k) || 0,
          activeUsers: activeMap.get(k) || 0,
        }));

        // Subscription distribution from subscriptionStatus
        const subDist = d.distributions?.subscriptionStatus || {};
        const colorMap = {
          active: '#10b981',
          expired: '#ef4444',
          inactive: '#9ca3af',
        };
        const subscriptionDistribution = Object.entries(subDist).map(([name, value]) => ({
          name: String(name),
          value: Number(value || 0),
          color: colorMap[String(name)] || '#3b82f6',
        }));

        // Industry (business type) distribution by counts
        const industryDist = d.distributions?.organizationTypes || {};
        const industryData = Object.entries(industryDist).map(([industry, count]) => ({
          industry: String(industry),
          revenue: Number(count || 0),
        }));

        // FBR invoice analytics: total vs registered per month
        const invCountTotal = new Map();
        const invCountReg = new Map();
        invoices.forEach(inv => {
          const key = monthKey(inv.createdAt);
          invCountTotal.set(key, (invCountTotal.get(key) || 0) + 1);
          if (inv.status === 'registered') invCountReg.set(key, (invCountReg.get(key) || 0) + 1);
        });
        const invKeys = Array.from(new Set([...invCountTotal.keys(), ...invCountReg.keys()])).sort();
        const invoiceData = invKeys.map(k => ({
          month: monthLabel(k),
          invoices: invCountTotal.get(k) || 0,
          registered: invCountReg.get(k) || 0,
        }));

        // Top organizations already included
        const topOrganizations = Array.isArray(d.topOrganizations) ? d.topOrganizations : [];

        setDerived({ revenueData, userGrowthData, subscriptionDistribution, industryData, invoiceData, topOrganizations });
      } else {
        setError('Failed to load analytics data');
      }
    } catch (err) {
      setError(err.message || 'Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange, selectedMetric]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-yellow-500/20 rounded-tr-full"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Analytics & Reports</h1>
            <p className="text-orange-100 text-lg">
              Comprehensive insights into system usage, revenue, and performance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isTimeOpen}
                  className="w-[180px] justify-between bg-white/20 border-white/30 text-white hover:bg-white/30"
                >
                  {timeOptions.find(o => o.value === timeRange)?.label || "Select range"}
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-70" />
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[220px] p-1 bg-white border shadow-lg rounded-md"
                align="end"
                sideOffset={8}
              >
                <Command className="bg-transparent">
                  <CommandList className="max-h-60 overflow-auto">
                    <CommandGroup>
                      {timeOptions.map((opt) => (
                        <CommandItem
                          key={opt.value}
                          value={opt.value}
                          onSelect={() => {
                            setTimeRange(opt.value);
                            setIsTimeOpen(false);
                          }}
                          className="cursor-pointer"
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${timeRange === opt.value ? 'opacity-100' : 'opacity-0'}`}
                          />
                          {opt.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Button variant="outline" className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          [...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : error ? (
          <div className="col-span-full text-center py-8">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchAnalyticsData} className="mt-4" variant="outline">
              Retry
            </Button>
          </div>
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={`₨${analyticsData?.overview?.totalRevenue?.toLocaleString() || '0'}`}
              change={'+0%'}
              changeType={'positive'}
              icon={DollarSign}
              description="All organizations (selected period)"
            />
            <StatCard
              title="Active Users"
              value={analyticsData?.overview?.activeUsers?.toLocaleString() || '0'}
              change={'+0%'}
              changeType={'positive'}
              icon={Users}
              description="Active users across organizations"
            />
            <StatCard
              title="Organizations"
              value={analyticsData?.overview?.totalOrganizations?.toLocaleString() || '0'}
              change={'+0%'}
              changeType={'positive'}
              icon={Building2}
              description="Total registered organizations"
            />
            <StatCard
              title="Total Invoices"
              value={analyticsData?.overview?.totalInvoices?.toLocaleString() || '0'}
              change={'+0%'}
              changeType={'positive'}
              icon={Activity}
              description="Invoices generated (selected period)"
            />
          </>
        )}
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" />
              Revenue Growth
            </CardTitle>
            <CardDescription>
              Monthly revenue and growth trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-[300px] bg-gray-200 rounded"></div>
              </div>
            ) : derived.revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={derived.revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₨${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    fill="#3b82f6" 
                    fillOpacity={0.1}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No revenue data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              User Growth
            </CardTitle>
            <CardDescription>
              New users vs active users over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-[300px] bg-gray-200 rounded"></div>
              </div>
            ) : derived.userGrowthData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={derived.userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="newUsers" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="New Users"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="activeUsers" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Active Users"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">No user growth data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Subscription Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Subscription Plans
            </CardTitle>
            <CardDescription>
              Distribution of active subscriptions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-[250px] bg-gray-200 rounded mb-4"></div>
                <div className="flex justify-center space-x-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-4 bg-gray-200 rounded w-20"></div>
                  ))}
                </div>
              </div>
            ) : derived.subscriptionDistribution.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <Pie
                      data={derived.subscriptionDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {derived.subscriptionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex justify-center space-x-4 mt-4">
                  {derived.subscriptionDistribution.map((entry) => (
                    <div key={entry.name} className="flex items-center space-x-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: entry.color }}
                      />
                      <span className="text-sm">{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">No subscription data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industry Breakdown */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Industry Distribution
            </CardTitle>
            <CardDescription>
              Organizations and revenue by industry
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-[250px] bg-gray-200 rounded"></div>
              </div>
            ) : derived.industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={derived.industryData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(value) => `${value}`} />
                  <YAxis dataKey="industry" type="category" width={100} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="revenue" fill="#8b5cf6" name="Organizations" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center">
                <p className="text-muted-foreground">No industry data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FBR Transaction Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileBarChart className="mr-2 h-5 w-5" />
            FBR Transaction Analytics
          </CardTitle>
          <CardDescription>
            Transaction volume and FBR synchronization rates
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="animate-pulse">
              <div className="h-[300px] bg-gray-200 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="text-center p-4 border rounded-lg">
                    <div className="h-8 bg-gray-200 rounded mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            </div>
            ) : derived.invoiceData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={derived.invoiceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar dataKey="invoices" fill="#3b82f6" name="Total Invoices" />
                  <Bar dataKey="registered" fill="#10b981" name="FBR Registered" />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {analyticsData?.fbrSyncRate ? `${analyticsData.fbrSyncRate.toFixed(1)}%` : '0%'}
                  </p>
                  <p className="text-sm text-muted-foreground">FBR Sync Rate</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {analyticsData?.monthlyInvoices?.toLocaleString() || '0'}
                  </p>
                  <p className="text-sm text-muted-foreground">Monthly Invoices</p>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {analyticsData?.avgProcessingTime || '0s'}
                  </p>
                  <p className="text-sm text-muted-foreground">Avg Processing Time</p>
                </div>
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-muted-foreground">No invoice data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Organizations */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Organizations</CardTitle>
          <CardDescription>
            Organizations ranked by revenue and transaction volume
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-20"></div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="h-4 bg-gray-200 rounded w-20 mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                  </div>
                </div>
              ))
            ) : derived.topOrganizations.length > 0 ? (
              derived.topOrganizations.map((org, index) => (
                <div key={org.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">#{index + 1}</span>
                    </div>
                    <div>
                      <p className="font-medium">{org.name || 'Unknown Organization'}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline" className="border-blue-200 text-blue-800">
                          {org.subscriptionPlan || 'Standard'}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{org.userCount || 0} users</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">₨{(org.revenue || 0).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{(org.invoiceCount || 0).toLocaleString()} invoices</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No organization data available</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}