import React from 'react';
import { cn } from '../../lib/utils';

export const Table: React.FC<React.HTMLAttributes<HTMLTableElement>> = ({ className, children, ...props }) => (
  <div className="w-full overflow-x-auto">
    <table className={cn('w-full text-left border-collapse text-sm', className)} {...props}>
      {children}
    </table>
  </div>
);

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <thead className={cn('bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 tracking-wider', className)} {...props}>
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, children, ...props }) => (
  <tbody className={cn('divide-y divide-slate-100 bg-white', className)} {...props}>
    {children}
  </tbody>
);

export const TableRow: React.FC<React.HTMLAttributes<HTMLTableRowElement>> = ({ className, children, ...props }) => (
  <tr className={cn('hover:bg-slate-50/70 transition-colors', className)} {...props}>
    {children}
  </tr>
);

export const TableHead: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <th className={cn('px-4 py-3.5 text-xs font-medium text-slate-500 uppercase tracking-wider', className)} {...props}>
    {children}
  </th>
);

export const TableCell: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <td className={cn('px-4 py-3.5 whitespace-nowrap text-slate-700', className)} {...props}>
    {children}
  </td>
);
