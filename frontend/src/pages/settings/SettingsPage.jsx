import { Button } from '../../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Input } from '../../components/ui/FormControls';
import { useAuth } from '../../hooks/useAuth';

export const SettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Settings</h1>
        <p className="mt-1 text-slate-500">Manage profile, organization, scoring, and compliance preferences.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Card shadow="sm">
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="First name" defaultValue={user?.first_name || ''} />
            <Input label="Last name" defaultValue={user?.last_name || ''} />
            <Input label="Email" defaultValue={user?.email || ''} className="sm:col-span-2" />
            <Button className="sm:col-span-2">Save profile</Button>
          </CardContent>
        </Card>

        <Card shadow="sm">
          <CardHeader><CardTitle>Organization</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input label="Organization name" defaultValue="haAIdra Demo Center" />
            <Input label="Timezone" defaultValue="Africa/Casablanca" />
            <Input label="Default language" defaultValue="English" />
            <Input label="Data retention" defaultValue="180 days" />
            <Button className="sm:col-span-2">Save organization</Button>
          </CardContent>
        </Card>

        <Card shadow="sm">
          <CardHeader><CardTitle>AI Scoring Settings</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {['Greeting quality', 'Empathy', 'Problem resolution', 'Professional language', 'Compliance'].map((label, index) => (
              <label key={label} className="flex items-center justify-between rounded-lg border border-slate-200 p-3">
                <span className="text-sm font-medium text-slate-700">{label}</span>
                <input type="number" min="0" max="100" defaultValue={[15, 25, 25, 15, 20][index]} className="h-9 w-20 rounded-lg border border-slate-300 px-2 text-sm" />
              </label>
            ))}
            <Button>Save scoring weights</Button>
          </CardContent>
        </Card>

        <Card shadow="sm">
          <CardHeader><CardTitle>Compliance Phrases</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <textarea
              rows={8}
              defaultValue={'This call may be recorded\nI can help you with that\nBefore we continue, can I verify your account\nIs there anything else I can help with today'}
              className="w-full rounded-lg border border-slate-300 p-3 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
            />
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" defaultChecked /> Flag missing disclosure</label>
              <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" defaultChecked /> Require closing phrase</label>
            </div>
            <Button>Save compliance settings</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
