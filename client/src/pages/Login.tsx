import { Wallet } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { ErrorNote } from "../components/ui/Feedback";
import { Field, Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../lib/api";

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto mt-20 max-w-sm px-4">
      <div className="animate-rise">
        <div className="mb-5 flex size-10 items-center justify-center rounded-xl bg-chama-600 text-white shadow-card-lift">
          <Wallet size={20} strokeWidth={2.1} />
        </div>
        <h1 className="text-display text-ink-900">Welcome back</h1>
        <p className="mt-1.5 text-sm text-ink-500">Log in to your chama's books.</p>
      </div>

      <form onSubmit={handleSubmit} className="animate-rise mt-7 flex flex-col gap-4" style={{ animationDelay: "60ms" }}>
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full py-2.5">
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="animate-rise mt-5 text-sm text-ink-500" style={{ animationDelay: "120ms" }}>
        No account?{" "}
        <Link
          to="/register"
          className="rounded font-medium text-chama-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
