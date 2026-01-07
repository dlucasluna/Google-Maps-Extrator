import React from 'react';
import { BusinessContact } from '../types';

interface ResultsTableProps {
  data: BusinessContact[];
}

export const ResultsTable: React.FC<ResultsTableProps> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 bg-white dark:bg-apple-card rounded-lg border border-slate-200 dark:border-apple-border shadow-sm transition-colors">
        <p className="text-slate-500 dark:text-apple-subtext">Nenhum resultado estruturado encontrado. Verifique os dados brutos.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden bg-white dark:bg-apple-card rounded-lg border border-slate-200 dark:border-apple-border shadow-sm transition-colors">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-apple-border">
          <thead className="bg-slate-50 dark:bg-white/5">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-apple-subtext uppercase tracking-wider">Empresa</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-apple-subtext uppercase tracking-wider">Contato</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-apple-subtext uppercase tracking-wider">Email</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-apple-subtext uppercase tracking-wider">Endereço</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-apple-subtext uppercase tracking-wider">Website</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-apple-card divide-y divide-slate-200 dark:divide-apple-border">
            {data.map((contact) => (
              <tr key={contact.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-slate-900 dark:text-apple-text">{contact.name}</div>
                      <div className="text-xs text-slate-500 dark:text-apple-subtext">{contact.type}</div>
                      <div className={`mt-1 inline-flex text-xs font-semibold rounded-sm px-1 ${
                         contact.rating !== 'N/A' && parseFloat(contact.rating) >= 4.5 
                           ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' 
                           : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                       }`}>
                         {contact.rating !== 'N/A' ? `${contact.rating} ★` : '-'}
                       </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-slate-900 dark:text-apple-text">{contact.phone}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {contact.email !== 'N/A' ? (
                     <a href={`mailto:${contact.email}`} className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
                       {contact.email}
                     </a>
                  ) : (
                    <span className="text-sm text-slate-400 dark:text-gray-600">N/A</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-900 dark:text-apple-text max-w-xs truncate" title={contact.address}>{contact.address}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 dark:text-blue-400 hover:underline">
                  {contact.website !== 'N/A' ? (
                    <a href={contact.website.startsWith('http') ? contact.website : `https://${contact.website}`} target="_blank" rel="noopener noreferrer">
                      Link
                    </a>
                  ) : (
                    <span className="text-slate-400 dark:text-gray-600">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};