import { Link } from 'react-router-dom';
import heroImage from '../../assets/hero.png';

const features = [
  {
    title: 'AI quality scoring',
    description: 'Score every call against greeting, empathy, resolution, language, and compliance rubrics.',
  },
  {
    title: 'Transcript intelligence',
    description: 'Turn recorded calls into searchable transcripts with summaries, topics, and coaching moments.',
  },
  {
    title: 'Sentiment visibility',
    description: 'Spot negative experiences, track team trends, and prioritize the calls that need attention.',
  },
  {
    title: 'Manager dashboards',
    description: 'Monitor agent performance, quality trends, call volume, and compliance in one clean workspace.',
  },
];

const pricing = [
  {
    name: 'Starter',
    price: '$149',
    description: 'For small teams validating AI call QA.',
    features: ['Up to 1,000 calls/month', 'Transcript and summary', 'Basic scoring dashboard', 'Email support'],
  },
  {
    name: 'Growth',
    price: '$399',
    description: 'For growing call centers with coaching workflows.',
    featured: true,
    features: ['Up to 5,000 calls/month', 'Sentiment and topic detection', 'Agent performance analytics', 'Reports and exports'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For regulated or high-volume operations.',
    features: ['Custom call volume', 'Advanced compliance rules', 'SSO and role controls', 'Dedicated success support'],
  },
];

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-slate-950">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-400 text-sm font-bold text-slate-950">hA</div>
            <span className="text-lg font-semibold">haAIdra</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-950">Features</a>
            <a href="#pricing" className="hover:text-slate-950">Pricing</a>
            <a href="#security" className="hover:text-slate-950">Security</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link to="/login" className="text-sm font-medium text-slate-700 hover:text-slate-950">Log in</Link>
            <Link to="/login" className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800">Start demo</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="overflow-hidden bg-slate-950 text-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8 lg:py-24">
            <div className="flex flex-col justify-center">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-300">AI call intelligence for call centers</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">haAIdra turns customer calls into coaching, quality, and revenue signals.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
                Analyze recorded or live calls with transcription, sentiment detection, topic discovery, quality scoring, and dashboards built for managers and agents.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-lg bg-cyan-400 px-5 text-sm font-semibold text-slate-950 hover:bg-cyan-300">Get started</Link>
                <a href="#pricing" className="inline-flex h-11 items-center justify-center rounded-lg border border-white/20 px-5 text-sm font-semibold text-white hover:bg-white/10">View pricing</a>
              </div>
            </div>
            <div className="relative">
              <img
                src={heroImage}
                alt="haAIdra dashboard preview"
                className="h-full min-h-[360px] w-full rounded-xl object-cover shadow-2xl shadow-cyan-950/40 ring-1 ring-white/10"
              />
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-slate-950">Everything your QA team needs to inspect every conversation.</h2>
            <p className="mt-4 text-lg leading-8 text-slate-600">haAIdra replaces random sampling with consistent AI-assisted review across calls, agents, topics, and compliance moments.</p>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-slate-50 py-20">
          <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 sm:px-6 lg:grid-cols-3 lg:px-8">
            <Metric value="100%" label="Call coverage instead of tiny QA samples" />
            <Metric value="5+" label="Quality dimensions scored per interaction" />
            <Metric value="24/7" label="Dashboards for managers and agents" />
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h2 className="text-3xl font-bold text-slate-950">Pricing that scales with your call volume.</h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-600">Start with the essentials, then add advanced analytics and compliance controls as your QA operation grows.</p>
            </div>
          </div>
          <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
            {pricing.map((plan) => (
              <div key={plan.name} className={`rounded-lg border p-6 shadow-sm ${plan.featured ? 'border-cyan-400 bg-slate-950 text-white shadow-xl shadow-cyan-950/20' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">{plan.name}</h3>
                  {plan.featured && <span className="rounded-full bg-cyan-400 px-3 py-1 text-xs font-semibold text-slate-950">Most popular</span>}
                </div>
                <div className="mt-6 flex items-end gap-1">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  {plan.price !== 'Custom' && <span className={plan.featured ? 'text-slate-300' : 'text-slate-500'}>/month</span>}
                </div>
                <p className={`mt-3 text-sm leading-6 ${plan.featured ? 'text-slate-300' : 'text-slate-600'}`}>{plan.description}</p>
                <ul className="mt-6 space-y-3 text-sm">
                  {plan.features.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className={plan.featured ? 'text-cyan-300' : 'text-emerald-600'}>✓</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login" className={`mt-8 inline-flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold ${plan.featured ? 'bg-cyan-400 text-slate-950 hover:bg-cyan-300' : 'bg-slate-950 text-white hover:bg-slate-800'}`}>
                  Choose {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </section>

        <section id="security" className="bg-slate-950 py-16 text-white">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-10 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="text-3xl font-bold">Built for operational trust.</h2>
                <p className="mt-4 text-slate-300">Role-based access, audit-ready reporting, and configurable compliance phrases help teams adopt AI review without losing control.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {['Role-based pages', 'Compliance checks', 'Exportable reports'].map((item) => (
                  <div key={item} className="rounded-lg border border-white/10 bg-white/5 p-5 text-sm font-medium text-slate-100">{item}</div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

const Metric = ({ value, label }) => (
  <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
    <div className="text-3xl font-bold text-cyan-700">{value}</div>
    <p className="mt-2 text-sm text-slate-600">{label}</p>
  </div>
);
