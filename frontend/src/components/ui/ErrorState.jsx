export const ErrorState = ({ title = 'Something went wrong', description = 'Please try again.' }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-sm">
    <h2 className="font-semibold text-red-800">{title}</h2>
    <p className="mt-1 text-red-700">{description}</p>
  </div>
);
