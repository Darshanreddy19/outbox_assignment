"use client";

import { User } from "@/types";

interface HeaderProps {
  user: User;
  onLogout: () => void;
}

export default function Header({ user, onLogout }: HeaderProps) {
  return (
    <header className="border-b border-[#30383e] bg-[#171b1f]/90 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-5 sm:px-6 h-[4.5rem] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#f08a5d] text-[#101316] flex items-center justify-center font-bold">O</div>
          <div><h1 className="text-lg font-semibold text-[#f5f1e8]">Outbox</h1><p className="text-[10px] uppercase tracking-[0.18em] text-[#657075]">Delivery desk</p></div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            {user.avatar && (
              <img
                src={user.avatar}
                alt={user.name || "User"}
                className="w-9 h-9 rounded-full ring-2 ring-[#30383e]"
              />
            )}
            <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-[#f5f1e8]">{user.name}</p>
                <p className="text-xs text-[#9ba4a8]">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onLogout}
            className="px-3.5 py-2 text-xs text-[#9ba4a8] hover:text-[#f5f1e8] border border-[#30383e] hover:border-[#f08a5d] rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}
