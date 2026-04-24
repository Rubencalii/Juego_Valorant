"use client";

import React from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";


const NAV_LINKS = [
  { href: "/", label: "INTEL", id: "nav-intel" },
  { href: "/play", label: "ARCHIVES", id: "nav-archives" },
  { href: "/ranking", label: "STATIONS", id: "nav-stations" },
];

export function Navbar() {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="fixed top-0 left-0 w-full z-[100] flex justify-between items-center px-6 py-4 border-b-2 border-[#ECE8E1]/10 bg-[#0F1923]/95 backdrop-blur-md">
        <Link href="/" className="text-2xl font-black italic tracking-tighter text-[#FF4655] font-display hover:opacity-80 transition-opacity">
          SPIKELINK<span className="text-[#ECE8E1]">.GG</span>
        </Link>

        {/* Center nav links — desktop only */}
        <div className="hidden md:flex gap-1">
          {NAV_LINKS.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.id}
                id={link.id}
                href={link.href}
                className={`px-3 py-1 font-display tracking-[0.2em] uppercase font-bold text-xs transition-all duration-75
                  ${isActive
                    ? "text-[#FF4655] border-b-2 border-[#FF4655]"
                    : "text-[#ECE8E1]/50 hover:text-[#ECE8E1] hover:bg-[#FF4655]/10"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Right side: Auth */}
        <div className="flex items-center gap-4">
          {status === "authenticated" ? (
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-black text-[#FF4655] uppercase tracking-widest font-display">
                  AGENTE AUTORIZADO
                </div>
                <div className="text-sm font-bold uppercase text-[#ECE8E1] font-display">
                  {session.user?.name}
                </div>
              </div>
              <button
                onClick={() => signOut()}
                className="font-display tracking-[0.2em] uppercase font-bold text-xs text-[#FF4655] border border-[#FF4655] px-4 py-1.5 hover:bg-[#FF4655]/10 transition-colors"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="font-display tracking-[0.2em] uppercase font-bold text-xs text-[#ECE8E1]/60 hover:text-[#ECE8E1] transition-colors"
              >
                LOGIN
              </Link>
              <Link
                href="/register"
                className="font-display tracking-[0.2em] uppercase font-bold text-xs text-[#FF4655] border border-[#FF4655] px-4 py-1.5 hover:bg-[#FF4655]/10 transition-colors"
              >
                REGISTER
              </Link>
            </div>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Navbar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full z-[100] flex justify-around items-center px-2 py-2 bg-[#0F1923] border-t-2 border-[#ECE8E1]/10">
        <MobileNavItem href="/" icon="⊞" label="HUB" isActive={pathname === "/"} />
        <MobileNavItem href="/play" icon="⚡" label="PLAY" isActive={pathname.startsWith("/play")} isPrimary />
        <MobileNavItem href="/ranking" icon="◈" label="RANKS" isActive={pathname === "/ranking"} />
        <MobileNavItem 
          href={status === "authenticated" ? "/profile" : "/login"} 
          icon="⊡" 
          label={status === "authenticated" ? "PROFILE" : "LOGIN"} 
          isActive={pathname === "/profile" || pathname === "/login"} 
        />
      </nav>
    </>
  );
}

function MobileNavItem({ href, icon, label, isActive, isPrimary }: {
  href: string;
  icon: string;
  label: string;
  isActive: boolean;
  isPrimary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center justify-center p-2 transition-colors min-w-[60px]
        ${isPrimary && isActive
          ? "bg-[#FF4655] text-[#ECE8E1]"
          : isActive
            ? "text-[#FF4655]"
            : "text-[#ECE8E1]/40 hover:text-[#FF4655]"
        }`}
    >
      <span className="text-lg mb-0.5">{icon}</span>
      <span className="font-display font-bold text-[10px] tracking-widest uppercase">{label}</span>
    </Link>
  );
}
