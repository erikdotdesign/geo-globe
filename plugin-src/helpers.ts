import Color from 'colorjs.io';

export const cleanSvgPathData = (d: string): string => {
  // Remove commas
  let cleaned = d.replace(/,/g, ' ');

  // Collapse multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Ensure space between commands and numbers (e.g. L10 10 becomes L 10 10)
  cleaned = cleaned.replace(/([A-Za-z])/g, ' $1 ').trim();

  return cleaned;
};

export const splitIntoSubpaths = (path: string): string[] => {
  if (!path) return []; // Nothing to split
  return path
    .split(/(?=M)/) // Split before every 'M' command
    .map(s => s.trim())
    .filter(Boolean);
};

export const getGeoFill = () => {
  const bgPaint = figma.currentPage.backgrounds?.[0] as SolidPaint;
  const bgColor = bgPaint
    ? new Color("srgb", [
        bgPaint.color.r,
        bgPaint.color.g,
        bgPaint.color.b
      ])
    : new Color("white");

  const black = new Color("srgb", [0, 0, 0]);
  const white = new Color("srgb", [1, 1, 1]);

  const contrastWithBlack = bgColor.contrast(black, "APCA");
  const contrastWithWhite = bgColor.contrast(white, "APCA");

  return Math.abs(contrastWithBlack) > Math.abs(contrastWithWhite) 
    ? { r: 0, g: 0, b: 0 } 
    : { r: 1, g: 1, b: 1 };
};

export const getTargetBounds = () => {
  const selection = figma.currentPage.selection;
  if (selection.length > 0) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const node of selection) {
      const box = node.absoluteBoundingBox;
      if (!box) continue;
      if (box.x < minX) minX = box.x;
      if (box.y < minY) minY = box.y;
      if (box.x + box.width > maxX) maxX = box.x + box.width;
      if (box.y + box.height > maxY) maxY = box.y + box.height;
    }

    if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
      // fallback if no valid bounding boxes
      return null;
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };
  } else {
    // fallback to viewport bounds
    const vw = figma.viewport.bounds.width;
    const vh = figma.viewport.bounds.height;
    return { x: figma.viewport.center.x - vw / 2, y: figma.viewport.center.y - vh / 2, width: vw, height: vh };
  }
};

export const scaleAndPositionGroup = (group: GroupNode, targetBounds: {x: number, y: number, width: number, height: number}, scalePercent = 1) => {
  const margin = 0; // optional margin in pixels
  const maxWidth = targetBounds.width * scalePercent - margin;
  const maxHeight = targetBounds.height * scalePercent - margin;

  const scaleX = maxWidth / group.width;
  const scaleY = maxHeight / group.height;

  // Use the smaller scale to keep aspect ratio
  const scale = Math.min(scaleX, scaleY);

  // Apply scale
  group.resize(group.width * scale, group.height * scale);

  // Position group centered inside target bounds
  group.x = targetBounds.x + (targetBounds.width - group.width) / 2;
  group.y = targetBounds.y + (targetBounds.height - group.height) / 2;

  return scale;
};

export const adjustStrokeWeights = (group: GroupNode, baseStrokeWeight = 0.5, scale = 1) => {
  const newStrokeWeight = baseStrokeWeight * scale;
  group.findAll(n => n.type === "VECTOR").forEach((vector) => {
    (vector as VectorNode).strokeWeight = Math.max(newStrokeWeight, 0.1); // minimum stroke weight
  });
};

export const groupAndLock = (nodes: SceneNode[], name: string): GroupNode => {
  const group = figma.group(nodes, figma.currentPage);
  group.lockAspectRatio();
  group.name = name;
  return group;
};

export const getBackgroundColor = () => {
  const bgPaint = figma.currentPage.backgrounds?.[0] as SolidPaint | undefined;
  return bgPaint?.color ?? { r: 1, g: 1, b: 1 };
};

export const createVectorFromPath = (pathData: string, bgColor: RGB): VectorNode => {
  const vector = figma.createVector();
  vector.vectorPaths = [{
    windingRule: "NONZERO",
    data: cleanSvgPathData(pathData),
  }];
  vector.fills = [{ type: "SOLID", color: getGeoFill() }];
  vector.strokes = [{ type: "SOLID", color: bgColor }];
  vector.strokeWeight = 0.5;
  vector.lockAspectRatio();
  return vector;
};

export const createPathDataGroup = ({ name, pathData }: { name: string; pathData: string }): GroupNode => {
  const bgColor = getBackgroundColor();
  const subpaths = splitIntoSubpaths(pathData);
  const vectors = subpaths.map(subpath => createVectorFromPath(subpath, bgColor));
  const group = groupAndLock(vectors, name);
  return group;
};

export const createPathDataGroups = (groupName: string, pathDataGroups: { name: string; pathData: string }[]): GroupNode => {
  const groups = pathDataGroups.map(createPathDataGroup);
  const group = groupAndLock(groups, groupName);
  return group;
};