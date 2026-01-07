import { GoogleGenAI } from "@google/genai";
import { SearchResult, BusinessContact, GroundingSource } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const SYSTEM_INSTRUCTION = `
Você é um Auditor de Dados Corporativos especializado em Mining (Mineração) de Leads.
Sua tarefa é construir bases de dados de contatos comerciais.

MANDAMENTOS:
1.  **DADOS REAIS**: Nunca invente dados. Se não achar o email, coloque "N/A".
2.  **EXAUSTIVIDADE**: O usuário quer TODOS os resultados possíveis, não apenas os top 20.
3.  **CAMPOS**: Nome, Telefone, Email, Endereço, Website.
4.  **ESTRATÉGIA DE PAGINAÇÃO**:
    *   Você receberá o número da "Página" (Lote) atual.
    *   Se for Página 1: Foque nos resultados mais populares e relevantes.
    *   Se for Página 2+: Foque em empresas menores, concorrentes de nicho, ou empresas em ruas adjacentes que não apareceram no topo.
    *   Tente NÃO repetir empresas que seriam óbvias na página 1.

SAÍDA OBRIGATÓRIA: Tabela Markdown.
`;

export const searchBusinesses = async (
  query: string, 
  userLat?: number, 
  userLng?: number,
  page: number = 1
): Promise<SearchResult> => {
  try {
    const modelId = 'gemini-2.5-flash';

    const tools = [
      { googleMaps: {} }, 
      { googleSearch: {} }
    ];
    
    // Configure location bias
    let toolConfig = undefined;
    if (userLat && userLng) {
      toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: userLat,
            longitude: userLng
          }
        }
      };
    }

    // Dynamic prompt based on "Page" to force variety
    let searchFocus = "";
    if (page === 1) {
      searchFocus = "Traga os resultados principais e mais bem avaliados desta região.";
    } else if (page === 2) {
      searchFocus = "IGNORE os resultados mais famosos. Busque empresas menores, novos estabelecimentos ou aqueles com menos avaliações que o Maps esconde.";
    } else {
      searchFocus = "Faça uma varredura profunda (Deep Search). Procure em diretórios da web por empresas que talvez nem tenham pino no Maps, mas existam na região.";
    }

    const prompt = `
    PESQUISA DE LEADS - LOTE ${page}
    Termo: "${query}"
    
    DIRETRIZ: ${searchFocus}
    
    OBJETIVO:
    1. Encontre cerca de 20-30 empresas NOVAS para este lote.
    2. Para cada uma, cruze dados do Maps e Busca Web para achar o TELEFONE e EMAIL.
    3. Gere a tabela.
    `;

    const response = await ai.models.generateContent({
      model: modelId,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: tools,
        toolConfig: toolConfig,
        temperature: 0.7 + (page * 0.1), // Increase creativity/randomness on later pages to find unique items
        maxOutputTokens: 8192,
        thinkingConfig: { thinkingBudget: 4096 } 
      },
    });

    const text = response.text || '';
    
    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    
    chunks.forEach((chunk: any) => {
      if (chunk.web) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      } else if (chunk.maps) {
        const title = chunk.maps.title || 'Google Maps';
        const uri = chunk.maps.placeId 
          ? `https://www.google.com/maps/place/?q=place_id:${chunk.maps.placeId}` 
          : '#';
        sources.push({ title, uri });
      }
    });

    const contacts = parseMarkdownTable(text);

    return {
      contacts,
      sources,
      rawText: text
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

const parseMarkdownTable = (markdown: string): BusinessContact[] => {
  const lines = markdown.split('\n').filter(line => line.trim() !== '');
  const contacts: BusinessContact[] = [];
  
  let headersFound = false;

  for (const line of lines) {
    if (line.includes('|')) {
      const columns = line.split('|').map(col => col.trim()).filter((col, index, arr) => {
        if (index === 0 && col === '') return false;
        if (index === arr.length - 1 && col === '') return false;
        return true;
      });

      if (line.includes('---')) {
        headersFound = true;
        continue;
      }

      if (!headersFound && (line.toLowerCase().includes('nome') || line.toLowerCase().includes('name'))) {
        continue; 
      }

      if (columns.length >= 5) {
        contacts.push({
          id: crypto.randomUUID(),
          name: columns[0] || 'N/A',
          phone: columns[1] || 'N/A',
          email: columns[2] || 'N/A',
          address: columns[3] || 'N/A',
          website: columns[4] || 'N/A',
          rating: columns[5] || 'N/A',
          type: columns[6] || 'GMN'
        });
      }
    }
  }

  return contacts;
};