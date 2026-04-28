import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { PageWrapper } from './PageWrapper';
import { cn } from '../../lib/utils';

export const AppShell = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col min-h-screen">
          <Topbar />
          <main className="flex-1 p-6">
            <PageWrapper>
              <Outlet />
            </PageWrapper>
          </main>
        </div>
      </div>
    </div>
  );
};
