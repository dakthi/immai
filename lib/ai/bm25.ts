export interface BM25Document {
  id: string;
  title: string;
  content: string;
  type: string;
  category?: string | null;
  tags?: string[] | null;
  tokens: string[];
}

export interface BM25Result {
  id: string;
  title: string;
  content: string;
  type: string;
  category?: string | null;
  tags?: string[] | null;
  score: number;
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(token => token.length > 2);
}

function preprocessDocument(title: string, content: string): string[] {
  // Combine title (weighted higher) and content
  const titleTokens = tokenize(title);
  const contentTokens = tokenize(content);
  
  // Give title tokens more weight by including them multiple times
  return [...titleTokens, ...titleTokens, ...titleTokens, ...contentTokens];
}

// Custom BM25 implementation
class BM25 {
  private documents: string[][];
  private docFreqs: Map<string, number>;
  private idf: Map<string, number>;
  private docLengths: number[];
  private avgDocLength: number;
  private k1: number;
  private b: number;

  constructor(documents: string[][], k1 = 1.2, b = 0.75) {
    this.documents = documents;
    this.k1 = k1;
    this.b = b;
    this.docFreqs = new Map();
    this.idf = new Map();
    this.docLengths = [];
    this.avgDocLength = 0;
    
    this.buildIndex();
  }

  private buildIndex() {
    const totalLength = this.documents.reduce((sum, doc) => {
      this.docLengths.push(doc.length);
      return sum + doc.length;
    }, 0);
    
    this.avgDocLength = totalLength / this.documents.length;

    // Calculate document frequencies
    for (const doc of this.documents) {
      const uniqueTerms = new Set(doc);
      for (const term of uniqueTerms) {
        this.docFreqs.set(term, (this.docFreqs.get(term) || 0) + 1);
      }
    }

    // Calculate IDF values
    for (const [term, freq] of this.docFreqs.entries()) {
      this.idf.set(term, Math.log((this.documents.length - freq + 0.5) / (freq + 0.5)));
    }
  }

  search(query: string[]): number[] {
    return this.documents.map((doc, docIndex) => {
      let score = 0;
      const docLength = this.docLengths[docIndex];

      for (const term of query) {
        const termFreq = doc.filter(t => t === term).length;
        const idf = this.idf.get(term) || 0;
        
        if (termFreq > 0) {
          const numerator = termFreq * (this.k1 + 1);
          const denominator = termFreq + this.k1 * (1 - this.b + this.b * (docLength / this.avgDocLength));
          score += idf * (numerator / denominator);
        }
      }

      return score;
    });
  }
}

export class BM25Search {
  private bm25: BM25 | null;
  private documents: BM25Document[] = [];

  constructor() {
    this.bm25 = null;
  }

  addDocuments(documents: Array<{
    id: string;
    title: string;
    content: string;
    type: string;
    category?: string | null;
    tags?: string[] | null;
  }>) {
    console.log('🔍 [BM25] Adding', documents.length, 'documents to BM25 index');
    
    this.documents = documents.map(doc => ({
      ...doc,
      tokens: preprocessDocument(doc.title, doc.content)
    }));

    const corpus = this.documents.map(doc => doc.tokens);
    this.bm25 = new BM25(corpus);
    
    console.log('✅ [BM25] BM25 index created successfully');
  }

  search(query: string, limit = 5): BM25Result[] {
    if (!this.bm25 || this.documents.length === 0) {
      console.log('❌ [BM25] No documents in index');
      return [];
    }

    console.log('🔍 [BM25] Searching for:', query);
    const queryTokens = tokenize(query);
    console.log('🔤 [BM25] Query tokens:', queryTokens);
    
    const scores = this.bm25.search(queryTokens);
    console.log('📊 [BM25] Raw scores:', scores.slice(0, 10));
    
    const results = scores
      .map((score: number, index: number) => ({
        ...this.documents[index],
        score
      }))
      .filter((result: BM25Result) => result.score > 0)
      .sort((a: BM25Result, b: BM25Result) => b.score - a.score)
      .slice(0, limit)
      .map(({ tokens, ...rest }) => rest); // Remove tokens from result

    console.log('🎯 [BM25] Top results:');
    results.forEach((result, index) => {
      console.log(`  ${index + 1}. "${result.title}" (${result.type}) - Score: ${result.score.toFixed(3)}`);
    });

    return results;
  }

  getDocumentCount(): number {
    return this.documents.length;
  }
}