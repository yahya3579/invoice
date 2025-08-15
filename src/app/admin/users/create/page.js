"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, User, Mail, Phone, Building, Key, Shield, ChevronsUpDown, Check, Search } from "lucide-react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { userApi, organizationApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function CreateUserPage() {
  const router = useRouter();
  const [openOrg, setOpenOrg] = useState(false);
  const [openRole, setOpenRole] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    organizationId: "",
    role: undefined,
    subscription: undefined,
    fbrToken: "",
    password: "",
    confirmPassword: "",
    isActive: true,
    sendWelcomeEmail: true,
    notes: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(true);

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
    
    // Organization is now optional
    
    if (!formData.role || formData.role === "") {
      newErrors.role = "Role is required";
    }
    
          if (!formData.subscription || formData.subscription === "") {
        newErrors.subscription = "Subscription status is required";
      }
    
    if (!formData.fbrToken.trim()) {
      newErrors.fbrToken = "FBR token is required";
    }
    
    if (!formData.password.trim()) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long";
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Load organizations on component mount
  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setIsLoadingOrganizations(true);
        const response = await organizationApi.getOrganizations({ limit: 100 });
        if (response.success) {
          setOrganizations(response.data.organizations);
        }
      } catch (error) {
        console.error("Error loading organizations:", error);
      } finally {
        setIsLoadingOrganizations(false);
      }
    };

    fetchOrganizations();
  }, []);

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
        password: formData.password,
        role: formData.role.toLowerCase(),
        organizationId: formData.organizationId && formData.organizationId !== "none" ? parseInt(formData.organizationId) : null,
        fbrApiToken: formData.fbrToken || null,
        isActive: formData.isActive,
        subscriptionStatus: formData.subscription || 'inactive'
      };

      const response = await userApi.createUser(userData);
      
      if (response.success) {
        // Redirect to users list on success
        router.push("/admin/users");
      } else {
        // Handle API errors
        setErrors({ submit: response.error || 'Failed to create user' });
      }
    } catch (error) {
      console.error("Error creating user:", error);
      setErrors({ submit: error.message || 'Failed to create user' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateFBRToken = () => {
    const selectedOrg = organizations.find(org => org.id.toString() === formData.organizationId);
    const orgCode = selectedOrg ? 
      selectedOrg.name
        .split(" ")
        .map(word => word.charAt(0).toUpperCase())
        .join("")
        .substring(0, 3) : 'ORG';
    
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const year = new Date().getFullYear();
    const token = `FBR-${orgCode}-${randomNum}-${year}`;
    
    handleInputChange('fbrToken', token);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-600 via-green-700 to-blue-700 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-yellow-500/20 rounded-tr-full"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Link href="/admin/users">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Create New User</h1>
            <p className="text-green-100 text-lg">
              Add a new user to the TXS Invoice Management system
            </p>
          </div>
        </div>
      </div>

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
              <Label htmlFor="organizationId">Organization</Label>
              <Popover open={openOrg} onOpenChange={setOpenOrg}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openOrg}
                    className={cn(
                      "w-full justify-between h-11 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 bg-white",
                      errors.organizationId && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                    )}
                    disabled={isLoadingOrganizations}
                  >
                    <span className="truncate">
                      {formData.organizationId
                        ? (formData.organizationId === "none"
                            ? "No Organization"
                            : (organizations.find((o) => o.id.toString() === formData.organizationId)?.name || "Select organization"))
                        : (isLoadingOrganizations ? "Loading organizations..." : "Select organization")}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0 w-[400px] shadow-2xl border-gray-200 bg-white rounded-xl" align="start" sideOffset={8}>
                  <Command className="rounded-xl">
                    <div className="flex items-center border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100/50">
                      <Search className="mr-3 h-4 w-4 shrink-0 text-purple-600" />
                      <CommandInput 
                        placeholder="Search organizations..." 
                        className="border-0 focus:ring-0 bg-transparent placeholder:text-purple-600/70"
                      />
                    </div>
                    <CommandList className="max-h-[300px] p-2">
                      {isLoadingOrganizations ? (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500 mx-auto mb-2"></div>
                          Loading organizations...
                        </div>
                      ) : (
                        <>
                          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                            No organization found.
                          </CommandEmpty>
                          <CommandGroup heading="Organizations" className="p-2">
                            <CommandItem
                              key="none"
                              onSelect={() => {
                                handleInputChange('organizationId', 'none');
                                setOpenOrg(false);
                              }}
                              className="rounded-lg hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                            >
                              <Check className={cn("mr-3 h-4 w-4 text-purple-600", formData.organizationId === "none" ? "opacity-100" : "opacity-0")} />
                              <span className="font-medium">No Organization</span>
                            </CommandItem>
                            {organizations.map((org) => (
                              <CommandItem
                                key={org.id}
                                value={org.name}
                                onSelect={() => {
                                  handleInputChange('organizationId', org.id.toString());
                                  setOpenOrg(false);
                                }}
                                className="rounded-lg hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                              >
                                <Check className={cn("mr-3 h-4 w-4 text-purple-600", formData.organizationId === org.id.toString() ? "opacity-100" : "opacity-0")} />
                                <span className="font-medium">{org.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {errors.organizationId && (
                <p className="text-sm text-red-500">{errors.organizationId}</p>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role *</Label>
                <Popover open={openRole} onOpenChange={setOpenRole}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openRole}
                      className={cn(
                        "w-full justify-between h-11 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 bg-white",
                        errors.role && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      )}
                    >
                      <span className="truncate">
                        {formData.role ? formData.role.charAt(0).toUpperCase() + formData.role.slice(1) : "Select user role"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[350px] shadow-2xl border-gray-200 bg-white rounded-xl" align="start" sideOffset={8}>
                    <Command className="rounded-xl">
                      <div className="flex items-center border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100/50">
                        <Search className="mr-3 h-4 w-4 shrink-0 text-purple-600" />
                        <CommandInput 
                          placeholder="Search roles..." 
                          className="border-0 focus:ring-0 bg-transparent placeholder:text-purple-600/70"
                        />
                      </div>
                      <CommandList className="max-h-[300px] p-2">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                          No role found.
                        </CommandEmpty>
                        <CommandGroup heading="Roles" className="p-2">
                          {[
                            { key: 'user', label: 'User', description: 'Basic user permissions' },
                            { key: 'manager', label: 'Manager', description: 'Team management permissions' },
                            { key: 'admin', label: 'Admin', description: 'Full system access' },
                          ].map((r) => (
                            <CommandItem
                              key={r.key}
                              value={r.label}
                              onSelect={() => {
                                handleInputChange('role', r.key);
                                setOpenRole(false);
                              }}
                              className="rounded-lg hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                            >
                              <Check className={cn("mr-3 h-4 w-4 text-purple-600", formData.role === r.key ? "opacity-100" : "opacity-0")} />
                              <div>
                                <span className="font-medium">{r.label}</span>
                                <p className="text-xs text-muted-foreground">{r.description}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.role && (
                  <p className="text-sm text-red-500">{errors.role}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription Status *</Label>
                <Select value={formData.subscription || ""} onValueChange={(value) => handleInputChange('subscription', value)}>
                  <SelectTrigger className={cn(
                    "h-11 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 bg-white",
                    errors.subscription ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""
                  )}>
                    <SelectValue placeholder="Select subscription status" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-gray-200 shadow-2xl rounded-xl">
                    <SelectItem value="active" className="hover:bg-purple-50 cursor-pointer">Active</SelectItem>
                    <SelectItem value="inactive" className="hover:bg-purple-50 cursor-pointer">Inactive</SelectItem>
                    <SelectItem value="expired" className="hover:bg-purple-50 cursor-pointer">Expired</SelectItem>
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
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Key className="mr-2 h-5 w-5 text-yellow-600" />
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
                  onClick={generateFBRToken}
                  disabled={false}
                >
                  Generate
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

        {/* Security */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Shield className="mr-2 h-5 w-5 text-green-600" />
              Security Settings
            </CardTitle>
            <CardDescription>
              Password and account security options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter password"
                  className={errors.password ? "border-red-500" : ""}
                />
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm password"
                  className={errors.confirmPassword ? "border-red-500" : ""}
                />
                {errors.confirmPassword && (
                  <p className="text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div className="space-y-4">
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
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="sendWelcomeEmail">Send Welcome Email</Label>
                  <p className="text-sm text-muted-foreground">
                    Send account details and welcome message
                  </p>
                </div>
                <Switch
                  id="sendWelcomeEmail"
                  checked={formData.sendWelcomeEmail}
                  onCheckedChange={(checked) => handleInputChange('sendWelcomeEmail', checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Notes */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <div className="mr-2 h-5 w-5 text-gray-600">📝</div>
              Additional Notes
            </CardTitle>
            <CardDescription>
              Optional notes about this user
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
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {errors.submit && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
          <Button type="button" variant="outline" asChild className="border-gray-300 hover:bg-gray-50">
            <Link href="/admin/users">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg">
            {isSubmitting ? (
              <>Creating User...</>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4 text-white" />
                <span className="text-white">Create User</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}