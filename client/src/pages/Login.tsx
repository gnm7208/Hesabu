import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
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
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Welcome back</h1>
      <p className="mb-6 text-sm text-gray-500">Log in to your chama's books.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        No account?{" "}
        <Link to="/register" className="text-chama-600 hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
