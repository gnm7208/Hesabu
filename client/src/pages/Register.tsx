import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Wallet } from "lucide-react";
import { Button } from "../components/ui/Button";
import { ErrorNote } from "../components/ui/Feedback";
import { Field, Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../lib/api";

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await register(email, password, fullName, phone);
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
        <h1 className="text-display text-ink-900">Create your account</h1>
        <p className="mt-1.5 text-sm text-ink-500">Set up a chama and start closing the books.</p>
      </div>
      <form
        onSubmit={handleSubmit}
        className="animate-rise mt-7 flex flex-col gap-4"
        style={{ animationDelay: "60ms" }}
      >
        <Field label="Full name">
          <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} />
        </Field>
        <Field label="Email">
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </Field>
        <Field label="Phone (optional)">
          <Input
            type="tel"
            placeholder="0712345678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Password">
          <Input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </Field>
        {error && <ErrorNote>{error}</ErrorNote>}
        <Button type="submit" disabled={isSubmitting} className="mt-1 w-full py-2.5">
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="animate-rise mt-5 text-sm text-ink-500" style={{ animationDelay: "120ms" }}>
        Already have an account?{" "}
        <Link
          to="/login"
          className="rounded font-medium text-chama-700 underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-chama-500/40"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
