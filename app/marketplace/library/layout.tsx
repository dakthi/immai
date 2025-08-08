'use client';

import Link from 'next/link';
import { BookOpen, FileText, Download, Settings, Home, Search, Star, Filter, Grid3x3, List, Archive } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { usePathname } from 'next/navigation';

const libraryMenuItems = [
  {
    title: "All Resources",
    href: "/marketplace/library",
    icon: BookOpen,
  },
  {
    title: "Recently Added",
    href: "/marketplace/library?filter=recent",
    icon: FileText,
  },
  {
    title: "Favorites",
    href: "/marketplace/library?filter=favorites",
    icon: Star,
  },
  {
    title: "Downloaded",
    href: "/marketplace/library?filter=downloaded",
    icon: Download,
  },
  {
    title: "By Category",
    href: "/marketplace/library?view=categories",
    icon: Grid3x3,
  },
  {
    title: "Archived",
    href: "/marketplace/library?filter=archived",
    icon: Archive,
  },
];

const quickActions = [
  {
    title: "Search Library",
    href: "/marketplace/library?action=search",
    icon: Search,
  },
  {
    title: "Browse by Type",
    href: "/marketplace/library?filter=types",
    icon: Filter,
  },
  {
    title: "List View",
    href: "/marketplace/library?view=list",
    icon: List,
  },
];

function LibrarySidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/marketplace/library">
                <BookOpen className="size-6" />
                <span className="text-lg font-semibold">My Library</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* Main Navigation */}
        <SidebarMenu>
          {libraryMenuItems.map((item) => {
            const isActive = pathname === item.href || 
                            (item.href !== "/marketplace/library" && pathname.startsWith(item.href));
            
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton 
                  asChild 
                  isActive={isActive}
                >
                  <Link href={item.href}>
                    <item.icon className="size-4" />
                    {item.title}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        
        {/* Quick Actions */}
        <div className="mt-6">
          <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Quick Actions
          </div>
          <SidebarMenu className="mt-2">
            {quickActions.map((action) => (
              <SidebarMenuItem key={action.href}>
                <SidebarMenuButton asChild>
                  <Link href={action.href}>
                    <action.icon className="size-4" />
                    {action.title}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <Link href="/">
                <Home className="size-4" />
                Back to Chat
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <LibrarySidebar />
        <main className="flex-1">
          <div className="p-4 border-b bg-white">
            <SidebarTrigger />
          </div>
          <div className="p-0">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}