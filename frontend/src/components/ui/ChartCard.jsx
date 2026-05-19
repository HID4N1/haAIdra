import { Card, CardContent, CardHeader, CardTitle } from './Card';

export const ChartCard = ({ title, action, children, className = '' }) => (
  <Card shadow="sm" className={className}>
    <CardHeader className="flex-row items-center justify-between space-y-0">
      <CardTitle>{title}</CardTitle>
      {action}
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);
