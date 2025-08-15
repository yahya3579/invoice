"use client";

import { useState, useEffect } from "react";
import { userApi, organizationApi } from "@/lib/api";
import { ArrowLeft, Save, User, Mail, Phone, Building, Key, Shield, Trash2, RefreshCw } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";

// Removed mock data - now using API

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id;
  
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organizationId: "",
    role: "",
    subscription: "",
    fbrToken: "",
    isActive: true,
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Load user data and organizations in parallel
        const [userResponse, orgResponse] = await Promise.all([
          userApi.getUser(userId),
          organizationApi.getOrganizations({ limit: 100 })
        ]);
        
        if (userResponse.success) {
          const userData = userResponse.data;
          setUser(userData);
          
          // Split name into first and last name
          const nameParts = userData.name.split(' ');
          const firstName = nameParts[0] || '';
          const lastName = nameParts.slice(1).join(' ') || '';
          
          setFormData({
            firstName,
            lastName,
            email: userData.email,
            phone: userData.phone || '',
            organizationId: userData.organizationId ? userData.organizationId.toString() : '',
            role: userData.role.toLowerCase(),
            subscription: userData.subscriptionStatus.toLowerCase(),
            fbrToken: userData.fbrToken || '',
            isActive: userData.isActive,
            notes: userData.notes || ''
          });
        } else {
          setErrors({ load: 'Failed to load user data' });
        }
        
        if (orgResponse.success) {
          setOrganizations(orgResponse.data.organizations);
        }
      } catch (error) {
        console.error("Error loading user:", error);
        setErrors({ load: error.message });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    
    if (!formData.lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    }
    
    if (!formData.organizationId) {
      newErrors.organization = "Organization is required";
    }
    
    if (!formData.role) {
      newErrors.role = "Role is required";
    }
    
    if (!formData.subscription) {
      newErrors.subscription = "Subscription status is required";
    }
    
    if (!formData.fbrToken.trim()) {
      newErrors.fbrToken = "FBR token is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare user data for API
      const userData = {
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email,
        role: formData.role.toLowerCase(),
        organizationId: formData.organizationId ? parseInt(formData.organizationId) : null,
        fbrApiToken: formData.fbrToken || null,
        isActive: formData.isActive,
        subscriptionStatus: formData.subscription.toLowerCase()
      };

      const response = await userApi.updateUser(userId, userData);
      
      if (response.success) {
        // Redirect to users list on success
        router.push("/admin/users");
      } else {
        setErrors({ submit: response.error || 'Failed to update user' });
      }
    } catch (error) {
      console.error("Error updating user:", error);
      setErrors({ submit: error.message || 'Failed to update user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerateFBRToken = async () => {
    try {
      const response = await userApi.generateFbrToken(userId);
      if (response.success) {
        handleInputChange('fbrToken', response.data.fbrToken);
      } else {
        setErrors({ token: response.error || 'Failed to generate FBR token' });
      }
    } catch (error) {
      setErrors({ token: error.message || 'Failed to generate FBR token' });
    }
  };

  const handleDeleteUser = async () => {
    try {
      const response = await userApi.deleteUser(userId);
      if (response.success) {
        router.push("/admin/users");
      } else {
        alert('Failed to delete user: ' + response.error);
      }
    } catch (error) {
      alert('Error deleting user: ' + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center p-8 bg-gradient-to-br from-white to-blue-50 rounded-2xl shadow-lg">
          <RefreshCw className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-lg font-medium text-gray-900">Loading user data...</p>
          <p className="text-sm text-gray-600 mt-2">Please wait while we fetch the user information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-yellow-500/20 rounded-tr-full"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Link href="/admin/users">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Edit User</h1>
              <p className="text-purple-100 text-lg">
                Update user details and permissions
              </p>
            </div>
          </div>
          
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm" className="bg-red-500/20 border-red-300/30 text-white hover:bg-red-500/30">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete User
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the user account
                  and remove all associated data from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteUser} className="bg-red-600 hover:bg-red-700">
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* User Status Overview */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-indigo-50">
        <CardHeader>
          <CardTitle className="text-gray-900 flex items-center">
            <User className="mr-2 h-5 w-5 text-indigo-600" />
            User Overview
          </CardTitle>
          <CardDescription>Current status and key information</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col space-y-2 p-4 bg-gradient-to-br from-green-500 to-green-600 rounded-xl text-white">
              <Label className="text-sm text-green-100">Status</Label>
              <Badge className="bg-white/20 text-white hover:bg-white/30 w-fit">
                {user?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            
            <div className="flex flex-col space-y-2 p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl text-white">
              <Label className="text-sm text-blue-100">Member Since</Label>
              <p className="text-sm font-medium">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="flex flex-col space-y-2 p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl text-white">
              <Label className="text-sm text-purple-100">Last Active</Label>
              <p className="text-sm font-medium">
                {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="flex flex-col space-y-2 p-4 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl text-white">
              <Label className="text-sm text-orange-100">User ID</Label>
              <p className="text-sm font-medium">#{userId}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <User className="mr-2 h-5 w-5 text-blue-600" />
              Personal Information
            </CardTitle>
            <CardDescription>
              Basic details about the user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  placeholder="Enter first name"
                  className={errors.firstName ? "border-red-500" : ""}
                />
                {errors.firstName && (
                  <p className="text-sm text-red-500">{errors.firstName}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  placeholder="Enter last name"
                  className={errors.lastName ? "border-red-500" : ""}
                />
                {errors.lastName && (
                  <p className="text-sm text-red-500">{errors.lastName}</p>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="user@example.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+92-300-1234567"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organization & Role */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Building className="mr-2 h-5 w-5 text-purple-600" />
              Organization & Role
            </CardTitle>
            <CardDescription>
              Organization details and user permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization *</Label>
              <Select value={formData.organizationId || ""} onValueChange={(value) => handleInputChange('organizationId', value)}>
                <SelectTrigger className={errors.organization ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.organization && (
                <p className="text-sm text-red-500">{errors.organization}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Select value={formData.role || ""} onValueChange={(value) => handleInputChange('role', value)}>
                  <SelectTrigger className={errors.role ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription Status *</Label>
                <Select value={formData.subscription || ""} onValueChange={(value) => handleInputChange('subscription', value)}>
                  <SelectTrigger className={errors.subscription ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select subscription status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
                {errors.subscription && (
                  <p className="text-sm text-red-500">{errors.subscription}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* FBR Configuration */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Key className="mr-2 h-5 w-5 text-green-600" />
              FBR Configuration
            </CardTitle>
            <CardDescription>
              FBR integration settings for this user
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fbrToken">FBR Token *</Label>
              <div className="flex space-x-2">
                <Input
                  id="fbrToken"
                  value={formData.fbrToken}
                  onChange={(e) => handleInputChange('fbrToken', e.target.value)}
                  placeholder="FBR-ORG-001-2024"
                  className={errors.fbrToken ? "border-red-500" : ""}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={regenerateFBRToken}
                  disabled={!formData.organizationId}
                  className="border-green-300 text-green-700 hover:bg-green-50"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Regenerate
                </Button>
              </div>
              {errors.fbrToken && (
                <p className="text-sm text-red-500">{errors.fbrToken}</p>
              )}
              <p className="text-xs text-muted-foreground">
                FBR token for API integration and transaction tracking
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Account Settings */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Shield className="mr-2 h-5 w-5 text-orange-600" />
              Account Settings
            </CardTitle>
            <CardDescription>
              Account status and permissions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isActive">Active Account</Label>
                <p className="text-sm text-muted-foreground">
                  User can log in and access the system
                </p>
              </div>
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange('isActive', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Login History */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <RefreshCw className="mr-2 h-5 w-5 text-teal-600" />
              Recent Login History
            </CardTitle>
            <CardDescription>
              User&apos;s recent login activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {user?.loginHistory && user.loginHistory.length > 0 ? (
                user.loginHistory.map((login, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gradient-to-r from-teal-50 to-blue-50 border border-teal-100 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full shadow-sm"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {login.date} at {login.time}
                        </p>
                        <p className="text-xs text-teal-600">
                          IP: {login.ip}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <p>No login history available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Mail className="mr-2 h-5 w-5 text-gray-600" />
              Additional Notes
            </CardTitle>
            <CardDescription>
              Internal notes about this user
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Add any additional notes about this user..."
                rows={3}
                className="border-gray-200 focus:border-gray-400"
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
          <Button type="button" variant="outline" asChild className="border-gray-300 hover:bg-gray-50">
            <Link href="/admin/users">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-lg">
            {isSubmitting ? (
              <>Updating User...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4 text-white" />
                <span className="text-white">Update User</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}