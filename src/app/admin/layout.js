"use client";

import { 
  BarChart3, 
  Building2, 
  CreditCard, 
  LayoutDashboard, 
  Settings, 
  Users, 
  UserPlus, 
  Building,
  Triangle,
  LogOut
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const adminNavItems = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Users",
    icon: Users,
    items: [
      {
        title: "All Users",
        url: "/admin/users",
      },
      {
        title: "Create User",
        url: "/admin/users/create",
      },
    ],
  },
  {
    title: "Organizations",
    icon: Building2,
    items: [
      {
        title: "All Organizations",
        url: "/admin/organizations",
      },
      {
        title: "Create Organization",
        url: "/admin/organizations/create",
      },
    ],
  },
  {
    title: "Subscriptions",
    url: "/admin/subscriptions",
    icon: CreditCard,
  },
  {
    title: "Analytics",
    url: "/admin/analytics",
    icon: BarChart3,
  },
];

function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      const response = await fetch('/api/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Redirect to login page
        router.push('/login');
      } else {
        console.error('Logout failed');
      }
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  return (
    <Sidebar variant="inset" className="border-r-0">
      <SidebarHeader className="bg-gradient-to-br from-slate-900 to-blue-900 text-white border-b border-white/10">
        <div className="flex items-center space-x-3 px-2 py-2">
          <div className="relative">
            <Triangle className="w-8 h-8 text-blue-400 fill-blue-400" />
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500 to-purple-600 w-4 h-4 rounded-sm transform rotate-45 -translate-y-1 translate-x-1"></div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold text-white">TXS Admin</span>
            <span className="text-xs text-blue-200">Management Portal</span>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="bg-gradient-to-b from-slate-50 to-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-semibold">Admin Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.items ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg">
                        <item.icon className="w-4 h-4 text-blue-600" />
                        {item.title}
                      </div>
                      <div className="ml-6 space-y-1">
                        {item.items.map((subItem) => (
                          <SidebarMenuButton 
                            key={subItem.url} 
                            asChild
                            isActive={pathname === subItem.url}
                            className={pathname === subItem.url ? 
                              "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700" : 
                              "hover:bg-blue-50 hover:text-blue-700"
                            }
                          >
                            <Link href={subItem.url} className={pathname === subItem.url ? "!text-white" : ""}>
                              {subItem.title}
                            </Link>
                          </SidebarMenuButton>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <SidebarMenuButton 
                      asChild
                      isActive={pathname === item.url}
                      className={pathname === item.url ? 
                        "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700" : 
                        "hover:bg-blue-50 hover:text-blue-700"
                      }
                    >
                      <Link href={item.url} className={pathname === item.url ? "!text-white" : ""}>
                        <item.icon className={pathname === item.url ? "text-white" : "text-blue-600"} />
                        <span className={pathname === item.url ? "!text-white" : ""}>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="bg-gradient-to-t from-slate-100 to-white border-t border-slate-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button 
              onClick={handleLogout}
              variant="ghost" 
              className="w-full justify-start hover:bg-red-50 hover:text-red-700 text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Logout</span>
            </Button>
          </SidebarMenuItem>
          
        </SidebarMenu>
      </SidebarFooter>
      
      <SidebarRail />
    </Sidebar>
  );
}

function AdminHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar:h-12 bg-gradient-to-r from-white to-blue-50 border-b border-blue-100">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 hover:bg-blue-100 text-blue-600" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-blue-200" />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-xs text-blue-600">Manage your TXS Invoice system</p>
        </div>
      </div>
    </header>
  );
}

export default function AdminLayout({ children }) {
  return (
    <SidebarProvider>
      <AdminSidebar />
      <SidebarInset>
        <AdminHeader />
        <div className="flex flex-1 flex-col gap-6 p-6 pt-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 min-h-screen">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}