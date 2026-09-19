import { ShieldAlert, Trash2, UserRound } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { ErrorNote } from "../components/ui/Feedback";
import { Field, Input } from "../components/ui/Input";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../lib/api";

/**
 * Account page: who you are, and the one irreversible action — deleting the
 * account. App stores require an in-app deletion path; a treasurer also
 * deserves to take their data back without emailing anyone.
 */
export function Account() {
  const { user, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [armed, setArmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  async function handleDelete(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (!armed) {
      // First submit only arms the button, so a stray tap cannot erase a chama.
      setArmed(true);
      return;
    }
    setIsSubmitting(true);
    try {
      await deleteAccount(password);
      navigate("/login", { replace: true });
    } catch (err) {
      setArmed(false);
      setError(
        err instanceof ApiError && err.status === 403
          ? "That password is not right."
          : err instanceof ApiError
            ? err.message
            : "Could not delete your account. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="animate-rise">
        <h1 className="text-display text-ink-900">Your account</h1>
        <p className="mt-1.5 text-sm text-ink-500">The login behind every chama you keep books for.</p>
      </div>

      <Card className="animate-rise mt-6 p-5" style={{ animationDelay: "60ms" }}>
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-chama-100 text-chama-700">
            <UserRound size={20} />
          </div>
          <div>
            <p className="font-semibold text-ink-900">{user.full_name}</p>
            <p className="text-sm text-ink-500">{user.email}</p>
            {user.phone && <p className="text-sm text-ink-500">{user.phone}</p>}
          </div>
        </div>
      </Card>

      <Card className="animate-rise mt-6 border-red-200/70 p-5" style={{ animationDelay: "120ms" }}>
        <div className="flex items-start gap-3">
          <ShieldAlert className="mt-0.5 shrink-0 text-red-600" size={20} />
          <div>
            <h2 className="text-title text-ink-900">Delete my account</h2>
            <p className="mt-1 text-sm leading-6 text-ink-600">
              This erases your login and <strong>every chama you created</strong> — members, contributions
              and statements included. Download or share any statements you still need first. Where you
              were only a member of someone else&apos;s chama, that treasurer&apos;s books are kept and simply
              no longer linked to you. This cannot be undone.
            </p>
          </div>
        </div>

        <form onSubmit={handleDelete} className="mt-5 flex flex-col gap-4">
          <Field label="Confirm with your password">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setArmed(false);
              }}
              autoComplete="current-password"
            />
          </Field>
          {error && <ErrorNote>{error}</ErrorNote>}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" variant="danger" disabled={isSubmitting || !password}>
              <Trash2 size={15} />
              {isSubmitting ? "Deleting…" : armed ? "Yes, delete everything" : "Delete my account"}
            </Button>
            {armed && !isSubmitting && (
              <Button type="button" variant="ghost" onClick={() => setArmed(false)}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>
    </div>
  );
}
