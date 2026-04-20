// ─────────────────────────────────────────────
//  Search Service — calls /api/search
//  Phase 2: Elasticsearch / OpenSearch backend
// ─────────────────────────────────────────────
import { apiClient } from './api';

export interface SearchResult {
  id:          string;
  type:        'alert' | 'incident' | 'control' | 'risk' | 'finding';
  title:       string;
  description: string;
  severity?:   string;
  status?:     string;
  domain:      string;
  url:         string;
  score:       number;
}

export interface SearchResponse {
  data: SearchResult[];
  meta: { total: number; query: string; terms: string[] };
}

export async function search(
  q:       string,
  options?: { type?: string; domain?: string; limit?: number }
): Promise<SearchResponse> {
  const params: Record<string, string> = { q };
  if (options?.type)   params.type   = options.type;
  if (options?.domain) params.domain = options.domain;
  if (options?.limit)  params.limit  = String(options.limit);

  const res = await apiClient.get<SearchResult[]>('/search', params);
  return {
    data: res.data ?? [],
    meta: (res as unknown as SearchResponse).meta ?? { total: 0, query: q, terms: [] },
  };
}
