import { NodeType } from '../types/schema';

export const getNodeDimensions = (type: NodeType, hasRoots: boolean) => {
  switch (type) {
    case 'hub': return { w: 160, h: 160, shape: 'circle' }; 
    case 'bed': 
       return { w: 208, h: 100, shape: 'rect' }; 
    case 'source': 
    case 'plant': 
       return { w: 180, h: 80, shape: 'rect' };  
    case 'question':
       return { w: 160, h: 80, shape: 'rect' };
    default: return { w: 50, h: 50, shape: 'circle' };
  }
};

export const getVisualCenter = (node: { x: number, y: number, type: NodeType }) => {
  return { x: node.x, y: node.y };
};

export const getDockingPoint = (
  node: { x: number, y: number, type: NodeType }, 
  socket: 'top' | 'bottom',
  isExpanded: boolean,
  rootCount: number
) => {
  const center = { x: node.x, y: node.y };
  const dim = getNodeDimensions(node.type, rootCount > 0);

  if (socket === 'top') {
    return { x: center.x, y: center.y - dim.h / 2 };
  } else {
    // Bottom socket logic
    let yOffset = dim.h / 2;
    
    // If it's a Goal with Roots
    if (rootCount > 0 && (node.type === 'hub' || node.type === 'bed')) {
      if (node.type === 'hub') {
        // Round cards have the roots floating below at top[95%]
        // The root footer height is fixed at 32px (collapsed) or 32 + (count * 20) (expanded)
        const rootsHeight = isExpanded ? (32 + rootCount * 28) : 32; 
        yOffset = (dim.h * 0.45) + rootsHeight;
      } else {
        // Rectangular cards have roots appended to the bottom
        const totalRootsHeight = isExpanded ? rootCount * 28 + 32 : 32;
        yOffset = dim.h / 2 + totalRootsHeight;
      }
    }
    
    return { x: center.x, y: center.y + yOffset };
  }
};
