"use client";

import { LayoutDashboard, FilePlus2, Upload, History, User, FileText, LogOut, Triangle } from "lucide-react";
import Link from "next/link";
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "next/navigation";

const navItems = [
  { title: "Dashboard", url: "/user", icon: LayoutDashboard },
  { title: "Create Invoice", url: "/user/invoices/create", icon: FilePlus2 },
  { title: "Bulk Upload", url: "/user/invoices/bulk-upload", icon: Upload },
  { title: "Invoice History", url: "/user/invoices/history", icon: History },
  { title: "Profile", url: "/user/profile", icon: User },
];

function UserSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
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
            <span className="text-lg font-bold text-white">TXS User</span>
            <span className="text-xs text-blue-200">Invoice Portal</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="bg-gradient-to-b from-slate-50 to-white">
        <SidebarGroup>
          <SidebarGroupLabel className="text-slate-600 font-semibold">User Panel</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} className={pathname === item.url ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700" : "hover:bg-blue-50 hover:text-blue-700"}>
                    <Link href={item.url} className={pathname === item.url ? "!text-white" : ""}>
                      <item.icon className={pathname === item.url ? "text-white" : "text-blue-600"} />
                      <span className={pathname === item.url ? "!text-white" : ""}>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="bg-gradient-to-t from-slate-100 to-white border-t border-slate-200">
        <SidebarMenu>
          <SidebarMenuItem>
            <Button onClick={handleLogout} variant="ghost" className="w-full justify-start hover:bg-red-50 hover:text-red-700 text-red-600">
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

function UserHeader() {
  return (
    <header className="flex h-16 shrink-0 items-center gap-2 bg-gradient-to-r from-white to-blue-50 border-b border-blue-100">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1 hover:bg-blue-100 text-blue-600" />
        <Separator orientation="vertical" className="mr-2 h-4 bg-blue-200" />
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold text-gray-900">User Dashboard</h1>
          <p className="text-xs text-blue-600">Manage your invoices</p>
        </div>
      </div>
    </header>
  );
}

export default function UserLayout({ children }) {
  return (
    <SidebarProvider>
      <UserSidebar />
      <SidebarInset>
        <UserHeader />
        <div className="flex flex-1 flex-col gap-6 p-6 pt-4 bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 min-h-screen">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}


