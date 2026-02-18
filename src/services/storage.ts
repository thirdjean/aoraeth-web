import Papa from 'papaparse';
import { Node, Edge, LogEntry } from '../types/schema';

export const StorageService = {
  async loadNodes(): Promise<Node[]> {
    const stored = localStorage.getItem('aoraeth_nodes');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },

  async saveNodes(nodes: Node[]) {
    localStorage.setItem('aoraeth_nodes', JSON.stringify(nodes));
  },

  async loadEdges(): Promise<Edge[]> {
    const stored = localStorage.getItem('aoraeth_edges');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },

  async saveEdges(edges: Edge[]) {
    localStorage.setItem('aoraeth_edges', JSON.stringify(edges));
  },

  async clearAll() {
    localStorage.removeItem('aoraeth_nodes');
    localStorage.removeItem('aoraeth_edges');
    localStorage.removeItem('aoraeth_logs');
  },

  async loadLogs(): Promise<LogEntry[]> {
    const stored = localStorage.getItem('aoraeth_logs');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  },

  parseCSV<T>(csv: string): T[] {
    const result = Papa.parse<T>(csv, { header: true, dynamicTyping: true });
    return result.data;
  },

  generateCSV(data: any[]): string {
    return Papa.unparse(data);
  }
};
