import { LogOut, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold text-chama-700">
            <Wallet size={20} />
            Hesabu
          </Link>
          {user && (
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>{user.full_name}</span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <LogOut size={16} />
                Log out
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>
    </div>
  );
}
