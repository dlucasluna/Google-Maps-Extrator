import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-full mb-6 transition-colors">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold text-slate-800 dark:text-apple-text mb-2">Comece sua Pesquisa</h2>
      <p className="text-slate-500 dark:text-apple-subtext max-w-md">
        Digite um termo de busca (ex: "Dentistas no Centro", "Pizzarias em Moema") para extrair contatos do Google Meu Negócio.
      </p>
    </div>
  );
};