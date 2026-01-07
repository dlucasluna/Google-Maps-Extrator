import React, { useState, useEffect } from 'react';
import { searchBusinesses } from './services/geminiService';
import { exportToExcel } from './services/csvService';
import { SearchResult, SearchStatus, BusinessContact, GroundingSource } from './types';
import { EmptyState } from './components/EmptyState';
import { ResultsTable } from './components/ResultsTable';

const useGeolocation = () => {
  const [location, setLocation] = useState<{ lat: number; lng: number } | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          setError('Geolocalização não permitida ou erro ao obter localização.');
        }
      );
    }
  }, []);

  return { location, error };
};

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return { isDark, toggle: () => setIsDark(!isDark) };
};

const App: React.FC = () => {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SearchStatus>(SearchStatus.IDLE);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<SearchResult | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const { location, error } = useGeolocation();
  const { isDark, toggle } = useDarkMode();

  // Settings for the "Deep Search" loop
  const MAX_PAGES = 3; // Number of batches to fetch (approx 60-90 results total)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setStatus(SearchStatus.LOADING);
    setResult(null);
    setErrorMsg('');
    
    let allContacts: BusinessContact[] = [];
    let allSources: GroundingSource[] = [];
    
    // Deduplication Set (using normalized name + phone as key)
    const uniqueKeys = new Set<string>();

    try {
      for (let page = 1; page <= MAX_PAGES; page++) {
        setProgressText(`Extraindo lote ${page} de ${MAX_PAGES}... (Analisando dados)`);
        
        // Fetch batch
        const data = await searchBusinesses(query, location?.lat, location?.lng, page);
        
        // Process and deduplicate
        let newCount = 0;
        data.contacts.forEach(contact => {
          const key = `${contact.name.toLowerCase().trim()}_${contact.phone.replace(/\D/g, '')}`;
          if (!uniqueKeys.has(key)) {
            uniqueKeys.add(key);
            allContacts.push(contact);
            newCount++;
          }
        });

        // Accumulate sources
        allSources = [...allSources, ...data.sources];

        // If this batch returned very few *new* results, stop early to save time
        if (newCount === 0 && page > 1) {
          console.log("Nenhum resultado novo encontrado neste lote. Parando.");
          break;
        }

        // Small delay to be gentle (optional, but good practice)
        if (page < MAX_PAGES) {
           await new Promise(r => setTimeout(r, 1000));
        }
      }

      setResult({
        contacts: allContacts,
        sources: allSources,
        rawText: '' // Not needed for aggregated result
      });
      setStatus(SearchStatus.SUCCESS);

    } catch (err) {
      console.error(err);
      // If we have partial results, show them instead of full error
      if (allContacts.length > 0) {
        setResult({
          contacts: allContacts,
          sources: allSources,
          rawText: ''
        });
        setStatus(SearchStatus.SUCCESS);
        setErrorMsg('A busca foi interrompida, mas exibimos os dados coletados até o momento.');
      } else {
        setStatus(SearchStatus.ERROR);
        setErrorMsg('Falha ao buscar dados. Tente novamente.');
      }
    }
  };

  const handleExport = () => {
    if (result && result.contacts.length > 0) {
      exportToExcel(result.contacts, `leads_${query.replace(/\s+/g, '_')}_completo`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-apple-dark transition-colors duration-300 flex flex-col">
      {/* Header */}
      <header className="bg-white dark:bg-apple-card border-b border-slate-200 dark:border-apple-border sticky top-0 z-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-apple-text tracking-tight transition-colors">
              Google Maps Extrator <span className="text-xs font-normal text-slate-500 dark:text-apple-subtext ml-1">by Lucas Luna</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-500 dark:text-apple-subtext font-medium bg-slate-100 dark:bg-white/10 px-2 py-1 rounded">Deep Search Mode</span>
            
            {/* Dark Mode Toggle */}
            <button 
              onClick={toggle} 
              className="p-2 rounded-full bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-apple-text hover:bg-slate-200 dark:hover:bg-white/20 transition-all"
              aria-label="Alternar tema"
            >
              {isDark ? (
                // Sun Icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                // Moon Icon
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto mb-10">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex: Oficinas Mecânicas em Curitiba, Cafeterias..."
                className="block w-full p-4 pl-12 text-sm text-slate-900 dark:text-white border border-slate-300 dark:border-apple-border rounded-lg bg-white dark:bg-apple-card focus:ring-blue-500 focus:border-blue-500 shadow-sm transition-colors"
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg className="w-5 h-5 text-slate-400 dark:text-apple-subtext" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
              </div>
              <Button
                type="submit"
                disabled={status === SearchStatus.LOADING || !query.trim()}
                label={status === SearchStatus.LOADING ? 'Buscando...' : 'Extrair Tudo'}
              />
            </div>
          </form>
          {location && <p className="text-xs text-center text-slate-400 dark:text-apple-subtext mt-2">Localização ativa para melhor precisão</p>}
          
          {/* Progress Indicator */}
          {status === SearchStatus.LOADING && (
            <div className="mt-6">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
                <div className="bg-blue-600 h-2.5 rounded-full animate-pulse w-full"></div>
              </div>
              <p className="text-center text-sm font-medium text-blue-700 dark:text-blue-400 animate-pulse">{progressText}</p>
              <p className="text-center text-xs text-slate-500 dark:text-gray-400 mt-1">Isso pode levar até 30 segundos.</p>
            </div>
          )}
        </div>

        {/* Error Message */}
        {status === SearchStatus.ERROR && <ErrorMessage message={errorMsg} />}
        
        {/* Results */}
        {status === SearchStatus.SUCCESS && result && (
          <div className="space-y-6 animate-fade-in-up">
            <ResultsSummary result={result} onExport={handleExport} />
            {result.contacts.length > 0 ? (
               <ResultsTable data={result.contacts} />
            ) : (
               <EmptyState />
            )}
            <SourcesList sources={result.sources} />
          </div>
        )}

        {/* Initial Empty State */}
        {status === SearchStatus.IDLE && (
            <div className="mt-10">
                <EmptyState />
            </div>
        )}
      </main>
    </div>
  );
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-r-md">
    <div className="flex">
      <div className="flex-shrink-0">
        <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm text-red-700 dark:text-red-300">{message}</p>
      </div>
    </div>
  </div>
);

const ResultsSummary: React.FC<{ result: SearchResult, onExport: () => void }> = ({ result, onExport }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
    <div>
      <h2 className="text-lg font-bold text-slate-900 dark:text-apple-text">Empresas Encontradas</h2>
      <p className="text-sm text-slate-500 dark:text-apple-subtext">Total: {result.contacts.length} leads únicos extraídos.</p>
    </div>
    <Button onClick={onExport} label="Baixar Excel (.xlsx)" icon="download" type="button" />
  </div>
);

const SourcesList: React.FC<{ sources: any[] }> = ({ sources }) => (
  sources.length > 0 && (
    <div className="mt-8 pt-6 border-t border-slate-200 dark:border-apple-border">
      <h3 className="text-sm font-semibold text-slate-700 dark:text-apple-subtext uppercase tracking-wider mb-3">Fontes de Dados Cruzados</h3>
      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
        {/* Deduplicate sources for display */}
        {Array.from(new Set(sources.map(s => s.uri))).map((uri, idx) => {
           const source = sources.find(s => s.uri === uri);
           if (!source) return null;
           return (
            <a
              key={idx}
              href={source.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors border border-blue-200 dark:border-blue-800 truncate max-w-[250px]"
            >
              {source.title}
            </a>
          );
        })}
      </div>
    </div>
  )
);

const Button: React.FC<{
  onClick?: () => void;
  type: 'submit' | 'button';
  disabled?: boolean;
  label: string;
  icon?: string;
}> = ({ onClick, type, disabled, label, icon }) => (
  <button
    onClick={onClick}
    type={type}
    disabled={disabled}
    className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed shadow-emerald-500/20"
  >
    {icon && (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    )}
    {label}
  </button>
);

export default App;