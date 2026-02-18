import { NodeType } from '../types/schema';

export const getNodeDimensions = (type: NodeType, hasRoots: boolean) => {
  switch (type) {
    case 'hub': return { w: 160, h: 160, shape: 'circle' }; 
    case 'bed': 
       return { w: 208, h: 100, shape: 'rect' }; 
    case 'source': return { w: 176, h: 70, shape: 'rect' };
    case 'plant': return { w: 160, h: 42, shape: 'rect' };  
    default: return { w: 50, h: 50, shape: 'circle' };
  }
};

export const getVisualCenter = (node: { x: number, y: number, type: NodeType }) => {
  return { x: node.x, y: node.y };
};

export const getDockingPoint = (
  node: { x: number, y: number, type: NodeType }, 
  targetNode: { x: number, y: number, type: NodeType }, 
  hasRoots: boolean
) => {
  const center = { x: node.x, y: node.y };
  const targetCenter = { x: targetNode.x, y: targetNode.y }; 
  const dim = getNodeDimensions(node.type, hasRoots);

  const isBelow = targetCenter.y > center.y;
  
  // Refined Docking: All nodes now use Top-Center or Bottom-Center docking 
  // to emphasize hierarchical flow, even Round (Hub) nodes.
  return {
    x: center.x,
    y: isBelow ? center.y + dim.h/2 : center.y - dim.h/2
  };
};
