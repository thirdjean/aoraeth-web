import { Node, Edge, LogEntry } from '../types/schema';

export const calculateFlow = (
  nodes: Node[],
  edges: Edge[],
  logs: LogEntry[],
  timeRange: 'D' | 'W' | 'M' | 'Y' | 'Custom',
  customRange?: { start: string, end: string }
) => {
  const nodeInflows: Record<string, number> = {};
  const edgeFlows: Record<string, number> = {};
  
  let timeScale = 1;
  if (timeRange === 'D') timeScale = 1/7;
  if (timeRange === 'M') timeScale = 4.3;
  if (timeRange === 'Y') timeScale = 52;
  
  if (timeRange === 'Custom' && customRange) {
     const start = new Date(customRange.start).getTime();
     const end = new Date(customRange.end).getTime();
     const diffWeeks = Math.max(1, (end - start) / (1000 * 60 * 60 * 24 * 7));
     timeScale = diffWeeks; 
  }

  const nodeGeneratedFlow: Record<string, number> = {};

  // 1. Calculate base generated flow
  nodes.forEach(n => {
    let generated = 0;
    
    // PRIORITY 1: Debug Manual Overrides
    const debugMinutes = n.meta?.debugHours?.[timeRange === 'Custom' ? 'M' : timeRange];
    if (typeof debugMinutes === 'number' && debugMinutes >= 0) {
      generated = debugMinutes * 60;
    } else {
      // PRIORITY 2: Passive source capacity (h/week)
      if (n.meta?.capacity && n.type === 'source' && n.meta?.category === 'spring') {
        generated = (n.meta.capacity * 60) * timeScale;
      }

      // PRIORITY 3: Actual logs
      const now = new Date();
      const filteredLogs = logs.filter(log => {
        // MATCH LOGIC: Match by ID OR by Course/Task Name (for dragged course nodes)
        const idMatch = log.node_id === n.id;
        const nameMatch = log.course_name?.toLowerCase() === n.label.toLowerCase() || 
                          log.task_name?.toLowerCase() === n.label.toLowerCase();
        
        if (!idMatch && !nameMatch) return false;

        const logDate = new Date(log.timestamp);
        
        if (timeRange === 'Custom' && customRange) {
           const start = new Date(customRange.start);
           const end = new Date(customRange.end);
           end.setHours(23, 59, 59, 999);
           return logDate >= start && logDate <= end;
        }

        const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
        if (timeRange === 'D' && diffDays <= 1) return true;
        if (timeRange === 'W' && diffDays <= 7) return true;
        if (timeRange === 'M' && diffDays <= 30) return true;
        if (timeRange === 'Y' && diffDays <= 365) return true;
        return false;
      });
      generated += filteredLogs.reduce((acc, log) => acc + log.elapsed_minutes, 0);
    }
    
    const rootMinutes = (n.meta?.roots || []).reduce((acc, r) => acc + (r.hours * 60), 0);
    
    nodeGeneratedFlow[n.id] = generated;
    nodeInflows[n.id] = generated + rootMinutes; 
  });

  // 2. Propagate flow upwards (5 passes for hierarchy depth)
  for (let i = 0; i < 5; i++) {
    nodes.forEach(node => {
      const totalToDistribute = nodeInflows[node.id] || 0;
      if (totalToDistribute > 0) {
        const outgoingEdges = edges.filter(e => e.source_id === node.id);
        
        if (outgoingEdges.length === 1) {
          const edge = outgoingEdges[0];
          edgeFlows[`${edge.source_id}-${edge.target_id}`] = totalToDistribute;
        } else if (outgoingEdges.length > 1) {
          const totalWeightPoints = outgoingEdges.reduce((acc, e) => {
            if (e.weight === 1) return acc + 0.5;
            if (e.weight === 3) return acc + 1.5;
            return acc + 1.0;
          }, 0);

          outgoingEdges.forEach(edge => {
            let weightPoints = 1.0;
            if (edge.weight === 1) weightPoints = 0.5;
            if (edge.weight === 3) weightPoints = 1.5;
            const share = weightPoints / totalWeightPoints;
            edgeFlows[`${edge.source_id}-${edge.target_id}`] = totalToDistribute * share;
          });
        }
      }
    });

    nodes.forEach(node => {
      const incomingEdges = edges.filter(e => e.target_id === node.id);
      const received = incomingEdges.reduce((acc, e) => acc + (edgeFlows[`${e.source_id}-${e.target_id}`] || 0), 0);
      const rootMinutes = (node.meta?.roots || []).reduce((acc, r) => acc + (r.hours * 60), 0);
      nodeInflows[node.id] = (nodeGeneratedFlow[node.id] || 0) + received + rootMinutes;
    });
  }

  return { nodeInflows, edgeFlows, achievements: [] };
};
