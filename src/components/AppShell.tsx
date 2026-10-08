import React, { useState } from "react";
import { DesktopSidebar } from "./DesktopSidebar";
import { DesktopHeader } from "./DesktopHeader";
import { MobileHeader } from "./MobileHeader";
import { MobileBottomNavigation } from "./MobileBottomNavigation";
import { MobileDrawerModal } from "./MobileDrawerModal";
import { BantuanModal } from "./BantuanModal";
import { Pengaturan } from "../types";
import { useTheme } from "../context/ThemeContext";

interface AppShellProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isDarkMode?: boolean;
  onSetDarkMode?: (isDark: boolean) => void;
  isConnected: boolean;
  config: Pengaturan;
  currentUser: any;
  onLogout: () => void;
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({
  activeTab,
  setActiveTab,
  isConnected,
  config,
  currentUser,
  onLogout,
  children
}) => {
  const { isDark, toggleTheme, setTheme } = useTheme();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [mobileDrawerCategory, setMobileDrawerCategory] = useState<"akademik" | "more" | null>(null);
  const [isBantuanOpen, setIsBantuanOpen] = useState(false);

  return (
    <div 
      className="min-h-screen flex text-[#0F1E36] dark:text-[#F0F6FC] font-sans transition-all duration-350"
      style={{
        background: isDark 
          ? "linear-gradient(135deg, #101B2D 0%, #162B45 55%, #26334A 100%)"
          : "linear-gradient(135deg, #EEF7FF 0%, #FFFFFF 55%, #FFF8E8 100%)"
      }}
    >
      {/* 1. Desktop Sidebar (Sticky, Collapsible on Tablet & Desktop, Hidden on Mobile <= 768px) */}
      <DesktopSidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
        onOpenBantuan={() => setIsBantuanOpen(true)}
        currentUser={currentUser}
      />

      {/* Main Column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 2. Desktop Header (Visible on Desktop & Tablet > 768px) */}
        <DesktopHeader
          activeTab={activeTab}
          isDarkMode={isDark}
          onSetDarkMode={(dark) => setTheme(dark ? "dark" : "light")}
          isConnected={isConnected}
          config={config}
          currentUser={currentUser}
          onLogout={onLogout}
          onOpenBantuan={() => setIsBantuanOpen(true)}
        />

        {/* 3. Mobile Header (Visible on Mobile <= 768px) */}
        <MobileHeader
          activeTab={activeTab}
          onOpenMenu={() => setMobileDrawerCategory("more")}
          isDarkMode={isDark}
          onSetDarkMode={(dark) => setTheme(dark ? "dark" : "light")}
          isConnected={isConnected}
          currentUser={currentUser}
          config={config}
          onLogout={onLogout}
          onOpenBantuan={() => setIsBantuanOpen(true)}
        />

        {/* 4. Main Content Area */}
        <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 lg:p-8 custom-scrollbar pb-24 md:pb-8">
          {children}

          {/* Clean Footer Credit */}
          <footer className="mt-12 mb-4 pt-6 border-t border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] text-center select-none">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 px-4 py-2 rounded-2xl bg-white/90 dark:bg-[#192B43] border border-[rgba(120,160,200,0.18)] dark:border-[rgba(150,200,240,0.15)] shadow-2xs text-xs text-slate-500 dark:text-[#A5B9CF]">
              <span className="font-bold text-[#0F1E36] dark:text-[#F0F6FC]">Aplikasi Administrasi Guru</span>
              <span className="text-slate-300 dark:text-[#334E68]">&bull;</span>
              <span>Karya <strong className="text-[#0284C7] dark:text-[#67C7FF] font-bold">sdhebatjaya</strong></span>
              <span className="text-slate-300 dark:text-[#334E68]">&bull;</span>
              <a
                href="sdhebatjaya"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#0284C7] dark:text-[#67C7FF] hover:underline font-mono font-semibold"
              >
                sdhebatjaya.com
              </a>
            </div>
          </footer>
        </main>

        {/* 5. Mobile Bottom Navigation (Fixed on Mobile <= 768px, safe-area aware) */}
        <MobileBottomNavigation
          activeTab={activeTab}
          onNavigate={(tab) => {
            setActiveTab(tab);
            setMobileDrawerCategory(null);
          }}
          onOpenCategory={(category) => {
            setMobileDrawerCategory(category);
          }}
        />

        {/* Mobile Category & All Menu Drawer */}
        <MobileDrawerModal
          isOpen={mobileDrawerCategory !== null}
          activeCategory={mobileDrawerCategory}
          activeTab={activeTab}
          currentUser={currentUser}
          onSelectTab={(tabId) => {
            setActiveTab(tabId);
            setMobileDrawerCategory(null);
          }}
          onClose={() => setMobileDrawerCategory(null)}
          onOpenBantuan={() => {
            setMobileDrawerCategory(null);
            setIsBantuanOpen(true);
          }}
        />

        {/* Help & Guide Modal */}
        <BantuanModal
          isOpen={isBantuanOpen}
          onClose={() => setIsBantuanOpen(false)}
        />
      </div>
    </div>
  );
};
