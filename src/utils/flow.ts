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
  
  // Deduplicate edges to prevent "phantom" splits if the same link exists twice
  const uniqueEdges = edges.reduce((acc: Edge[], current) => {
    const x = acc.find(e => e.source_id === current.source_id && e.target_id === current.target_id);
    if (!x) acc.push(current);
    return acc;
  }, []);

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
    
    // Questions never generate or receive flow
    if (n.type === 'question') {
      nodeGeneratedFlow[n.id] = 0;
      nodeInflows[n.id] = 0;
      return;
    }

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
      // Skip questions in flow propagation
      if (node.type === 'question') return;

      const totalToDistribute = nodeInflows[node.id] || 0;
      if (totalToDistribute > 0) {
        // Only flow to non-question nodes
        const outgoingEdges = uniqueEdges.filter(e => e.source_id === node.id);
        const validOutgoing = outgoingEdges.filter(e => {
          const target = nodes.find(n => n.id === e.target_id);
          return target && target.type !== 'question';
        });
        
        if (validOutgoing.length === 1) {
          console.log(node.label,validOutgoing)
          const edge = validOutgoing[0];
          edgeFlows[`${edge.source_id}-${edge.target_id}`] = totalToDistribute;
        } else if (validOutgoing.length > 1) {
          const totalWeightPoints = validOutgoing.reduce((acc, e) => {
            return acc + (e.weight === 2 ? 0.3 : 1.0);
          }, 0);

          validOutgoing.forEach(edge => {
            const weightPoints = (edge.weight === 2 ? 0.3 : 1.0);
            const share = weightPoints / totalWeightPoints;
            edgeFlows[`${edge.source_id}-${edge.target_id}`] = totalToDistribute * share;
          });
        }
      }
    });

    nodes.forEach(node => {
      if (node.type === 'question') return;
      const incomingEdges = uniqueEdges.filter(e => e.target_id === node.id);
      const received = incomingEdges.reduce((acc, e) => acc + (edgeFlows[`${e.source_id}-${e.target_id}`] || 0), 0);
      const rootMinutes = (node.meta?.roots || []).reduce((acc, r) => acc + (r.hours * 60), 0);
      nodeInflows[node.id] = (nodeGeneratedFlow[node.id] || 0) + received + rootMinutes;
    });
  }

  return { nodeInflows, edgeFlows, achievements: [] };
};
