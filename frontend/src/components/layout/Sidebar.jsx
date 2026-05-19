import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

const navigation = {
  admin: [
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { name: 'Calls', href: '/calls', icon: PhoneIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Reports', href: '/reports', icon: DocumentIcon },
    { name: 'Agents', href: '/agents', icon: UserGroupIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ],
  manager: [
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { name: 'Calls', href: '/calls', icon: PhoneIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Reports', href: '/reports', icon: DocumentIcon },
    { name: 'Agents', href: '/agents', icon: UserGroupIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ],
  qa_supervisor: [
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { name: 'Calls', href: '/calls', icon: PhoneIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
    { name: 'Agents', href: '/agents', icon: UserGroupIcon },
  ],
  agent: [
    { name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { name: 'My Calls', href: '/calls', icon: PhoneIcon },
    { name: 'Settings', href: '/settings', icon: CogIcon },
  ],
};

export const Sidebar = () => {
  const { user } = useAuth();
  if (!user) return null;

  const navItems = navigation[user.role] || [];

  return (
    <aside className="hidden w-72 shrink-0 md:flex md:flex-col">
      <div className="flex min-h-screen flex-col bg-slate-950 px-4 py-5 text-white">
        <div className="flex items-center px-2">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500 shadow-sm shadow-cyan-500/30">
              <span className="text-sm font-bold tracking-wide text-slate-950">hA</span>
            </div>
            <div>
              <div className="text-lg font-semibold">haAIdra</div>
              <div className="text-xs text-slate-400">Call intelligence</div>
            </div>
          </div>
        </div>
        
        <nav className="mt-9 flex-1 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                cn(
                  'group relative flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-cyan-400/15 text-cyan-100'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive ? 'text-cyan-300' : 'text-slate-500 group-hover:text-slate-300'
                    )}
                  />
                  {item.name}
                </>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold">MVP workspace</div>
          <p className="mt-1 text-xs leading-5 text-slate-400">API-ready screens with mock fallback while backend endpoints settle.</p>
        </div>
      </div>
    </aside>
  );
};

// Icon components
function DashboardIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function PhoneIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function DocumentIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function ChartBarIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 13.5h4v7H3v-7zm7-10h4v17h-4v-17zm7 6h4v11h-4v-11z" />
    </svg>
  );
}

function UserGroupIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function CheckCircleIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function CogIcon(props) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}
