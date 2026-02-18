export type NodeType = 'hub' | 'bed' | 'plant' | 'source';
export type NodeStatus = 'active' | 'dormant' | 'decaying' | 'completed';

export interface Root {
  id: string;
  label: string;
  hours: number;
}

export interface Node {
  id: string;
  type: NodeType;
  label: string;
  status: NodeStatus;
  x: number;
  y: number;
  icon_key?: string;
  meta?: {
    decay_date?: string;
    description?: string;
    capacity?: number;
    category?: string;
    roots?: Root[];
    [key: string]: any;
  };
}

export interface Edge {
  source_id: string;
  target_id: string;
  weight: 1 | 2 | 3; // 1 (Trickle) / 2 (Stream) / 3 (River)
  type: 'active_stream' | 'groundwater';
}

export interface LogEntry {
  id: string;
  node_id: string;
  node_type: 'item' | 'reward';
  task_name: string;
  course_name: string | null;
  series_name: string | null;
  duration_minutes: number;
  elapsed_minutes: number;
  status: 'completed';
  platform: string;
  type: string;
  timestamp: string; // ISO 8601
}
