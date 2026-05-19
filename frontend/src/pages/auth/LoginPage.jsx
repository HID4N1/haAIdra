import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/FormControls';
import { useAuth } from '../../hooks/useAuth';
import loginHero from '../../assets/login-hero.jpg';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  if (isAuthenticated) return <Navigate to="/dashboard" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    const result = await login(form.email, form.password);
    if (result.success) navigate('/dashboard', { replace: true });
    else setError(result.error || 'Unable to sign in. Check your credentials and try again.');
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-950">
      <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
        <main className="flex items-center justify-center px-4 py-10 sm:px-6 lg:px-12">
          <div className="w-full max-w-[440px]">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-950 text-sm font-bold text-cyan-300 shadow-lg shadow-slate-300/60">
                hA
              </div>
              <div>
                <div className="text-lg font-semibold">haAIdra</div>
                <div className="text-xs text-slate-500">AI Call Intelligence for Call Centers</div>
              </div>
            </Link>

            <Link
              to="/"
              className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-950"
            >
              <span aria-hidden="true">←</span>
              Back to home
            </Link>

            <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-200/80 sm:p-8">
              <div>
                <p className="text-sm font-semibold text-cyan-700">Workspace access</p>
                <h2 className="mt-2 text-3xl font-bold text-slate-950">Sign in to haAIdra</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Continue to your quality, analytics, and coaching dashboard.
                </p>
              </div>

              <form className="mt-7 space-y-5" onSubmit={submit}>
                {error && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <Input
                  label="Email"
                  type="email"
                  autoComplete="email"
                  required
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@company.com"
                />

                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="Enter your password"
                />

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 text-slate-600">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500" />
                    Remember me
                  </label>
                  <button type="button" className="font-medium text-cyan-700 hover:text-cyan-900">
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="h-11 w-full" loading={isLoggingIn}>
                  {isLoggingIn ? 'Signing in...' : 'Continue'}
                </Button>
              </form>

              <div className="mt-7 border-t border-slate-200 pt-5">
                <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
                  <TrustItem label="Encrypted access" />
                  <TrustItem label="Role-aware views" />
                </div>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-500">
              Protected dashboard access for managers, QA supervisors, and agents.
            </p>
          </div>
        </main>

        <section className="relative hidden min-h-screen overflow-hidden bg-slate-950 p-4 lg:block">
          <div className="relative h-full overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-2xl">
            <img
              src={loginHero}
              alt="haAIdra call intelligence dashboard"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/20 to-slate-950/80" />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/10 via-transparent to-slate-950/30" />

            <div className="relative flex h-full flex-col justify-between p-10 text-white xl:p-12">
              <div className="inline-flex w-fit rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-medium text-cyan-100 backdrop-blur">
                Secure AI workspace for call-center teams
              </div>

              <div className="max-w-xl">
                <h1 className="text-4xl font-bold leading-tight xl:text-5xl">
                  Quality intelligence for every customer conversation.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-slate-200 xl:text-lg xl:leading-8">
                  Access transcripts, AI scoring, sentiment insights, coaching notes, and performance dashboards from one focused operating system.
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <Metric value="100%" label="review coverage" />
                <Metric value="RBAC" label="role-based access" />
                <Metric value="AI QA" label="scoring workflow" />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const Metric = ({ value, label }) => (
  <div className="rounded-lg border border-white/10 bg-slate-950/35 p-4 backdrop-blur-md">
    <div className="text-xl font-bold text-cyan-300">{value}</div>
    <div className="mt-1 text-xs leading-5 text-slate-300">{label}</div>
  </div>
);

const TrustItem = ({ label }) => (
  <div className="flex items-center gap-2">
    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
    <span>{label}</span>
  </div>
);
