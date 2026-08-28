import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
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
    <div className="mx-auto mt-16 max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold text-gray-900">Create your account</h1>
      <p className="mb-6 text-sm text-gray-500">Set up a chama and start closing the books.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-gray-500">
        Already have an account?{" "}
        <Link to="/login" className="text-chama-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
