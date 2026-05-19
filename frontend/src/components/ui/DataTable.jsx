export const DataTable = ({ columns, rows, getRowKey = (_, index) => index }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-left text-sm">
      <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
        <tr>{columns.map((column) => <th key={column.key} className="px-5 py-3">{column.header}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((row, index) => (
          <tr key={getRowKey(row, index)} className="hover:bg-slate-50">
            {columns.map((column) => <td key={column.key} className="px-5 py-4">{column.render ? column.render(row) : row[column.key]}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);
