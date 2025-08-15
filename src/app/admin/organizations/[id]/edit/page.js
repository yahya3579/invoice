"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Save, Building2, Mail, Phone, Loader2, ChevronsUpDown, Check, Search } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";

import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { organizationApi } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function EditOrganizationPage() {
  const router = useRouter();
  const params = useParams();
  const organizationId = params.id;

  const [openBusinessType, setOpenBusinessType] = useState(false);
  const [openSubscriptionPlan, setOpenSubscriptionPlan] = useState(false);
  const [formData, setFormData] = useState({
    // Basic Information
    name: "",
    ntn: "",
    address: "",
    
    // Contact Information
    email: "",
    phone: "",
    
    // Business Information
    businessType: "",
    
    // Subscription Information
    subscriptionPlan: "",
    subscriptionExpiresAt: ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organization, setOrganization] = useState(null);

  // Fetch organization data
  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setIsLoading(true);
        const response = await organizationApi.getOrganization(organizationId);
        
        if (response.success) {
          const org = response.data;
          setOrganization(org);
          
          // Pre-fill form data
          setFormData({
            name: org.name || "",
            ntn: org.ntn || "",
            address: org.address || "",
            email: org.email || "",
            phone: org.phone || "",
            businessType: org.businessType || "",
            subscriptionPlan: org.subscriptionPlan || "",
            subscriptionExpiresAt: org.subscriptionExpiresAt ? 
              new Date(org.subscriptionExpiresAt).toISOString().split('T')[0] : ""
          });
        } else {
          setErrors({ fetch: response.error || 'Failed to load organization' });
        }
      } catch (error) {
        console.error("Error fetching organization:", error);
        setErrors({ fetch: error.message || 'Failed to load organization' });
      } finally {
        setIsLoading(false);
      }
    };

    if (organizationId) {
      fetchOrganization();
    }
  }, [organizationId]);

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
    
    // Basic Information validation
    if (!formData.name.trim()) {
      newErrors.name = "Organization name is required";
    }
    
    if (!formData.ntn.trim()) {
      newErrors.ntn = "NTN (National Tax Number) is required";
    } else if (!/^\d{7}$/.test(formData.ntn.replace(/\s/g, ''))) {
      newErrors.ntn = "NTN must be 7 digits";
    }
    
    if (!formData.address.trim()) {
      newErrors.address = "Address is required";
    }
    
    // Contact Information validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    // Business Information validation
    if (!formData.businessType || formData.businessType === "") {
      newErrors.businessType = "Business type is required";
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
      // Prepare the data according to the schema
      const organizationData = {
        name: formData.name.trim(),
        ntn: formData.ntn.trim(),
        address: formData.address.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        businessType: formData.businessType || null,
        subscriptionPlan: formData.subscriptionPlan || null,
        subscriptionExpiresAt: formData.subscriptionExpiresAt || null
      };
      
      const response = await organizationApi.updateOrganization(organizationId, organizationData);
      
      if (response.success) {
        // Redirect to organizations list on success
        router.push("/admin/organizations");
      } else {
        setErrors({ submit: response.error || 'Failed to update organization' });
      }
    } catch (error) {
      console.error("Error updating organization:", error);
      setErrors({ submit: error.message || 'Failed to update organization' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white">
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-0 w-32 h-16 bg-purple-500/20 rounded-tr-full"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          </div>
          <div className="relative z-10 flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Link href="/admin/organizations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Edit Organization</h1>
              <p className="text-blue-100 text-lg">
                Update organization details and settings
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-gray-600">Loading organization details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (errors.fetch) {
    return (
      <div className="space-y-6">
        {/* Page Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white">
          <div className="absolute inset-0">
            <div className="absolute bottom-0 left-0 w-32 h-16 bg-purple-500/20 rounded-tr-full"></div>
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          </div>
          <div className="relative z-10 flex items-center space-x-4">
            <Button variant="outline" size="icon" asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30">
              <Link href="/admin/organizations">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="text-4xl font-bold tracking-tight mb-2">Edit Organization</h1>
              <p className="text-blue-100 text-lg">
                Update organization details and settings
              </p>
            </div>
          </div>
        </div>

        {/* Error State */}
        <Alert className="border-red-200 bg-red-50">
          <AlertDescription className="text-red-800">
            {errors.fetch}
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button onClick={() => window.location.reload()} variant="outline">
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 p-8 text-white">
        <div className="absolute inset-0">
          <div className="absolute bottom-0 left-0 w-32 h-16 bg-purple-500/20 rounded-tr-full"></div>
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
        </div>
        <div className="relative z-10 flex items-center space-x-4">
          <Button variant="outline" size="icon" asChild className="bg-white/20 border-white/30 text-white hover:bg-white/30">
            <Link href="/admin/organizations">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-4xl font-bold tracking-tight mb-2">Edit Organization</h1>
            <p className="text-blue-100 text-lg">
              Update organization details and settings
            </p>
          </div>
        </div>
      </div>

      {/* Organization Status */}
      {organization && (
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{organization.name}</h3>
                  <p className="text-sm text-gray-600">NTN: {organization.ntn}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge 
                  variant={organization.status === 'Active' ? 'default' : 'secondary'}
                  className={organization.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
                >
                  {organization.status}
                </Badge>
                <Badge variant="outline" className="border-blue-200 text-blue-700">
                  {organization.stats?.totalUsers || 0} Users
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Building2 className="mr-2 h-5 w-5 text-blue-600" />
              Basic Information
            </CardTitle>
            <CardDescription>
              General details about the organization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  className={errors.name ? "border-red-500" : ""}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ntn">NTN (National Tax Number) *</Label>
                <Input
                  id="ntn"
                  value={formData.ntn}
                  onChange={(e) => handleInputChange('ntn', e.target.value)}
                  placeholder="1234567"
                  maxLength={7}
                  className={errors.ntn ? "border-red-500" : ""}
                />
                {errors.ntn && (
                  <p className="text-sm text-red-500">{errors.ntn}</p>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="address">Address *</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter complete address..."
                rows={3}
                className={errors.address ? "border-red-500" : ""}
              />
              {errors.address && (
                <p className="text-sm text-red-500">{errors.address}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Mail className="mr-2 h-5 w-5 text-green-600" />
              Contact Information
            </CardTitle>
            <CardDescription>
              Organization's contact details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="info@organization.com"
                  className={errors.email ? "border-red-500" : ""}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="+92-21-1234567"
                  className={errors.phone ? "border-red-500" : ""}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center text-gray-900">
              <Building2 className="mr-2 h-5 w-5 text-purple-600" />
              Business Information
            </CardTitle>
            <CardDescription>
              Business type and subscription details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="businessType">Business Type *</Label>
                <Popover open={openBusinessType} onOpenChange={setOpenBusinessType}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openBusinessType}
                      className={cn(
                        "w-full justify-between h-11 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 bg-white",
                        errors.businessType && "border-red-500 focus:border-red-500 focus:ring-red-500/20"
                      )}
                    >
                      <span className="truncate">
                        {formData.businessType ? formData.businessType.charAt(0).toUpperCase() + formData.businessType.slice(1) : "Select business type"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[350px] shadow-2xl border-gray-200 bg-white rounded-xl" align="start" sideOffset={8}>
                    <Command className="rounded-xl">
                      <div className="flex items-center border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100/50">
                        <Search className="mr-3 h-4 w-4 shrink-0 text-purple-600" />
                        <CommandInput 
                          placeholder="Search business types..." 
                          className="border-0 focus:ring-0 bg-transparent placeholder:text-purple-600/70"
                        />
                      </div>
                      <CommandList className="max-h-[300px] p-2">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                          No business type found.
                        </CommandEmpty>
                        <CommandGroup heading="Business Types" className="p-2">
                          {[
                            { key: 'product', label: 'Product', description: 'Manufacturing and selling physical products' },
                            { key: 'service', label: 'Service', description: 'Providing services to customers' },
                          ].map((type) => (
                            <CommandItem
                              key={type.key}
                              value={type.label}
                              onSelect={() => {
                                handleInputChange('businessType', type.key);
                                setOpenBusinessType(false);
                              }}
                              className="rounded-lg hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                            >
                              <Check className={cn("mr-3 h-4 w-4 text-purple-600", formData.businessType === type.key ? "opacity-100" : "opacity-0")} />
                              <div>
                                <span className="font-medium">{type.label}</span>
                                <p className="text-xs text-muted-foreground">{type.description}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.businessType && (
                  <p className="text-sm text-red-500">{errors.businessType}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subscriptionPlan">Subscription Plan</Label>
                <Popover open={openSubscriptionPlan} onOpenChange={setOpenSubscriptionPlan}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openSubscriptionPlan}
                      className="w-full justify-between h-11 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200 bg-white"
                    >
                      <span className="truncate">
                        {formData.subscriptionPlan ? formData.subscriptionPlan.charAt(0).toUpperCase() + formData.subscriptionPlan.slice(1) : "Select subscription plan"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0 w-[350px] shadow-2xl border-gray-200 bg-white rounded-xl" align="start" sideOffset={8}>
                    <Command className="rounded-xl">
                      <div className="flex items-center border-b border-gray-100 px-4 py-3 bg-gradient-to-r from-purple-50 to-purple-100/50">
                        <Search className="mr-3 h-4 w-4 shrink-0 text-purple-600" />
                        <CommandInput 
                          placeholder="Search subscription plans..." 
                          className="border-0 focus:ring-0 bg-transparent placeholder:text-purple-600/70"
                        />
                      </div>
                      <CommandList className="max-h-[300px] p-2">
                        <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
                          No subscription plan found.
                        </CommandEmpty>
                        <CommandGroup heading="Subscription Plans" className="p-2">
                          {[
                            { key: 'standard', label: 'Standard', description: 'Basic features and support' },
                          ].map((plan) => (
                            <CommandItem
                              key={plan.key}
                              value={plan.label}
                              onSelect={() => {
                                handleInputChange('subscriptionPlan', plan.key);
                                setOpenSubscriptionPlan(false);
                              }}
                              className="rounded-lg hover:bg-purple-50 cursor-pointer transition-colors duration-200"
                            >
                              <Check className={cn("mr-3 h-4 w-4 text-purple-600", formData.subscriptionPlan === plan.key ? "opacity-100" : "opacity-0")} />
                              <div>
                                <span className="font-medium">{plan.label}</span>
                                <p className="text-xs text-muted-foreground">{plan.description}</p>
                              </div>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subscriptionExpiresAt">Subscription Expiry Date</Label>
              <Input
                id="subscriptionExpiresAt"
                type="date"
                value={formData.subscriptionExpiresAt}
                onChange={(e) => handleInputChange('subscriptionExpiresAt', e.target.value)}
                placeholder="Select expiry date"
                className="h-11 border-gray-200 hover:border-gray-300 focus:border-purple-500 focus:ring-purple-500/20 transition-all duration-200"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {errors.submit && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              {errors.submit}
            </AlertDescription>
          </Alert>
        )}

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
          <Button type="button" variant="outline" asChild className="border-gray-300 hover:bg-gray-50">
            <Link href="/admin/organizations">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin text-white" />
                Updating Organization...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4 text-white" />
                <span className="text-white">Update Organization</span>
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
