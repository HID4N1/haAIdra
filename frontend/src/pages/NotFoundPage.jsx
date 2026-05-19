import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/Card';

export const NotFoundPage = () => (
  <div className="flex min-h-[60vh] items-center justify-center">
    <Card shadow="sm" className="max-w-md text-center">
      <CardContent className="py-12">
        <p className="text-sm font-semibold text-cyan-700">404</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-950">Page not found</h1>
        <p className="mt-2 text-slate-500">The page you are looking for is not part of the haAIdra workspace.</p>
        <Link className="mt-6 inline-flex rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white" to="/dashboard">Go to dashboard</Link>
      </CardContent>
    </Card>
  </div>
);
