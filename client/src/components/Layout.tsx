import { LogOut, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { AppearanceToggle } from "./ui/AppearanceToggle";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen">
      {/* Translucent chrome rather than an opaque strip: content passes under it,
          so the page reads as one surface with a floating layer over it. The
          saturate() keeps colour from going flat behind the blur. */}
      <header className="sticky top-0 z-20 border-b border-ink-200/60 bg-surface/70 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-md font-semibold tracking-[-0.011em] text-chama-700 transition-opacity duration-150 hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40"
          >
            <Wallet size={19} strokeWidth={2.1} />
            Hesabu
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <AppearanceToggle />
            {user && (
              <div className="flex items-center gap-1">
              <span className="hidden px-2 text-ink-600 sm:inline">{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-ink-500 transition-[transform,background-color,color] duration-150 ease-out-strong hover:bg-ink-100 hover:text-ink-800 active:scale-[0.97] active:duration-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40"
              >
                <LogOut size={15} />
                Log out
              </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-7">{children}</main>
    </div>
  );
}
