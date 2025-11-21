// // // // import * as d3 from "d3";

// // // // import { transformPositiveNegative } from './options/PosNeg.js';
// // // // import { transformZScore } from './options/zScore.js';
// // // // import { transformPercentile } from './options/Percentile.js';
// // // // import { transformCustomThreshold } from './options/CustomThreshold.js';
// // // // import { transformRadial } from './options/Radial.js';
// // // // import { transformDecisionTree } from "./options/DecisionTree.js";

// // // // export const CoordinateTransforms = {
// // // //     POSITIVE_NEGATIVE: 'positive_negative',
// // // //     Z_SCORE: 'z_score',
// // // //     PERCENTILE: 'percentile',
// // // //     CUSTOM_THRESHOLD: 'custom_threshold',
// // // //     RADIAL: 'radial',
// // // //     DECISION_TREE: 'decision_tree'
// // // // };


// // // // export const transformCoordinates = (points, strategy, options = {}) => {
// // // //     try {
// // // //         switch (strategy) {
// // // //             case CoordinateTransforms.POSITIVE_NEGATIVE:
// // // //                 return transformPositiveNegative(points);
// // // //             case CoordinateTransforms.Z_SCORE:
// // // //                 return transformZScore(points, options.threshold || 0);
// // // //             case CoordinateTransforms.PERCENTILE:
// // // //                 return transformPercentile(points, options.percentile || 50);
// // // //             case CoordinateTransforms.CUSTOM_THRESHOLD:
// // // //                 return transformCustomThreshold(points, options.threshold || 0);
// // // //             case CoordinateTransforms.RADIAL:
// // // //                 return transformRadial(points, options);
// // // //             case CoordinateTransforms.DECISION_TREE:
// // // //                 return transformDecisionTree(points, options);
// // // //             default:
// // // //                 console.warn(`Unknown transformation strategy: ${strategy}, using positive_negative`);
// // // //                 return transformPositiveNegative(points);
// // // //         }
// // // //     } catch (error) {
// // // //         console.error(`Error in coordinate transformation (${strategy}):`, error);
// // // //         console.warn('Falling back to positive_negative transformation');
// // // //         return transformPositiveNegative(points);
// // // //     }
// // // // };

// // // // // Enhanced bit vector generation with decision tree support
// // // // export const generateBitVector = (point, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
// // // //     let coordinates;

// // // //     if (strategy === CoordinateTransforms.DECISION_TREE) {
// // // //         if (useTransformed && point.nodeAssignments) {
// // // //             // Use node path to create binary vector
// // // //             const binaryPath = point.nodeAssignments.map((assignment, index) => {
// // // //                 return (assignment.nodeId % 2).toString();
// // // //             }).join('');
// // // //             return binaryPath || '0';
// // // //         } else {
// // // //             coordinates = Object.entries(point).filter(([key, value]) =>
// // // //                 key !== "Point_ID" &&
// // // //                 key !== "nodeAssignments" &&
// // // //                 key !== "treePath" &&
// // // //                 key !== "predicted_class" &&
// // // //                 key !== "nodePath" &&
// // // //                 key !== "decisionPath" &&
// // // //                 key !== "finalSector" &&
// // // //                 typeof value === 'number' &&
// // // //                 !isNaN(value)
// // // //             );
// // // //         }
// // // //     } else {
// // // //         coordinates = Object.entries(point).filter(([key]) => {
// // // //             if (useTransformed) {
// // // //                 return key.endsWith('_binary');
// // // //             }
// // // //             return key !== "Point_ID" && !key.endsWith('_binary');
// // // //         });
// // // //     }

// // // //     if (!coordinates || coordinates.length === 0) {
// // // //         console.warn(`No coordinates found for point ${point.Point_ID} with strategy ${strategy}, useTransformed: ${useTransformed}`);
// // // //         coordinates = Object.entries(point).filter(([key, value]) =>
// // // //             key !== "Point_ID" &&
// // // //             typeof value === 'number' &&
// // // //             !isNaN(value)
// // // //         );
// // // //     }

// // // //     let bitVector;
// // // //     if (useTransformed && strategy === CoordinateTransforms.DECISION_TREE) {
// // // //         bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
// // // //     } else if (useTransformed) {
// // // //         bitVector = coordinates.map(([_, value]) => String(value)).join("");
// // // //     } else {
// // // //         bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
// // // //     }

// // // //     return bitVector || '0';
// // // // };

// // // // // Enhanced sector point counts calculation with decision tree support
// // // // export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {
// // // //     if (transformStrategy === CoordinateTransforms.RADIAL) {
// // // //         return pointsData.map(ringData => [ringData.points.length]);
// // // //     }


// // // //     if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// // // //         // For decision tree, calculate counts based on nodes at each depth
// // // //         return pointsData.map((ringData, ringIndex) => {
// // // //             try {
// // // //                 const sectors = ringData.sectors || ringData.nodes?.length || 1;
// // // //                 const counts = Array(sectors).fill(0);

// // // //                 (ringData.points || []).forEach(point => {
// // // //                     try {
// // // //                         if (point.nodeAssignments) {
// // // //                             const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// // // //                             if (assignment) {
// // // //                                 // Use sectorIndex instead of nodeId
// // // //                                 const sectorIndex = assignment.sectorIndex !== undefined ? assignment.sectorIndex : assignment.nodeId;

// // // //                                 if (sectorIndex >= 0 && sectorIndex < sectors) {
// // // //                                     counts[sectorIndex]++;
// // // //                                 } else {
// // // //                                     console.warn(`Invalid sectorIndex ${sectorIndex} for point ${point.Point_ID} at depth ${ringIndex} (max sectors: ${sectors})`);
// // // //                                 }
// // // //                             } else {
// // // //                                 console.warn(`No assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
// // // //                             }
// // // //                         } else {
// // // //                             console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// // // //                         }
// // // //                     } catch (error) {
// // // //                         console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// // // //                     }
// // // //                 });
// // // //                 console.log("calculate sector point function here")
// // // //                 console.log(`Ring ${ringIndex} (Decision Tree): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} nodes`);
// // // //                 return counts;
// // // //             } catch (error) {
// // // //                 console.error(`Error processing ring ${ringIndex} with decision tree:`, error);
// // // //                 return Array(ringData.sectors || 1).fill(0);
// // // //             }
// // // //         });
// // // //     }

// // // //     return pointsData.map((ringData, index) => {
// // // //         try {
// // // //             let pointsToCount = ringData.points;
// // // //             pointsToCount = transformCoordinates(ringData.points, transformStrategy, transformOptions);

// // // //             const sectors = ringData.sectors || 2 ** (index + 1);
// // // //             const counts = Array(sectors).fill(0);

// // // //             pointsToCount.forEach(point => {
// // // //                 try {
// // // //                     const sectorIndex = calculateSectorIndex(point, index, true, transformStrategy);
// // // //                     if (sectorIndex >= 0 && sectorIndex < sectors) {
// // // //                         counts[sectorIndex]++;
// // // //                     } else {
// // // //                         console.warn(`Invalid sector index ${sectorIndex} for point ${point.Point_ID} in ring ${index}`);
// // // //                     }
// // // //                 } catch (error) {
// // // //                     console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// // // //                 }
// // // //             });

// // // //             console.log(`Ring ${index} (${transformStrategy}): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} sectors`);
// // // //             return counts;
// // // //         } catch (error) {
// // // //             console.error(`Error processing ring ${index} with strategy ${transformStrategy}:`, error);
// // // //             const sectors = 2 ** (index + 1);
// // // //             return Array(sectors).fill(0);
// // // //         }
// // // //     });
// // // // };

// // // // // Enhanced sector index calculation with decision tree support
// // // // export const calculateSectorIndex = (point, ringIndex, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
// // // //     if (strategy === CoordinateTransforms.DECISION_TREE) {
// // // //         if (point.nodeAssignments) {
// // // //             const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// // // //             if (assignment) {
// // // //                 return assignment.nodeId;
// // // //             }
// // // //             console.warn(`No node assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
// // // //         } else {
// // // //             console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// // // //         }
// // // //         return 0;
// // // //     }

// // // //     const bitVector = generateBitVector(point, useTransformed, strategy);

// // // //     if (bitVector.length === 0) {
// // // //         console.warn(`Empty bit vector for point ${point.Point_ID}, returning sector 0`);
// // // //         return 0;
// // // //     }

// // // //     const sectors = 2 ** (ringIndex + 1);
// // // //     const binaryValue = parseInt(bitVector, 2) || 0;
// // // //     const sectorIndex = Math.min(binaryValue, sectors - 1);

// // // //     return sectorIndex;
// // // // };
// // // // // Helper function to get active sector mapping for point positioning
// // // // export const getActiveSectorMapping = (sectorCounts, showEmptySectors = true) => {
// // // //     const activeMaps = [];

// // // //     sectorCounts.forEach((counts, ringIndex) => {
// // // //         if (showEmptySectors) {
// // // //             activeMaps[ringIndex] = Array.from({ length: counts.length }, (_, i) => i);
// // // //         } else {
// // // //             activeMaps[ringIndex] = counts
// // // //                 .map((count, index) => count > 0 ? index : -1)
// // // //                 .filter(index => index !== -1);
// // // //         }
// // // //     });

// // // //     return activeMaps;
// // // // };

// // // // // Fixed proportional sector angles calculation that maintains hierarchical structure
// // // // export const calculateProportionalSectorAngles = (sectorCounts, showEmptySectors = true) => {
// // // //     const sectorAngles = [];
// // // //     const lastRingIndex = sectorCounts.length - 1;

// // // //     const activeSectorMaps = [];

// // // //     for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
// // // //         const currentCounts = sectorCounts[ringIndex];
// // // //         const sectors = currentCounts.length;

// // // //         if (sectors === 1) {
// // // //             sectorAngles[ringIndex] = [359 * Math.PI / 180];
// // // //             activeSectorMaps[ringIndex] = [0];
// // // //             continue;
// // // //         }

// // // //         const totalPoints = currentCounts.reduce((sum, count) => sum + count, 0) || 1;
// // // //         const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

// // // //         if (ringIndex === lastRingIndex) {
// // // //             if (showEmptySectors) {
// // // //                 const emptySectors = currentCounts.filter(count => count === 0).length;
// // // //                 const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

// // // //                 const angles = currentCounts.map(count => {
// // // //                     return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
// // // //                 });

// // // //                 sectorAngles[ringIndex] = angles;
// // // //                 activeSectorMaps[ringIndex] = Array.from({ length: sectors }, (_, i) => i);
// // // //             } else {
// // // //                 const activeSectors = [];
// // // //                 const activeAngles = [];

// // // //                 currentCounts.forEach((count, index) => {
// // // //                     if (count > 0) {
// // // //                         activeSectors.push(index);
// // // //                         activeAngles.push((count / totalPoints) * 2 * Math.PI);
// // // //                     }
// // // //                 });

// // // //                 const angles = Array(sectors).fill(0);
// // // //                 activeSectors.forEach((sectorIndex, i) => {
// // // //                     angles[sectorIndex] = activeAngles[i];
// // // //                 });

// // // //                 sectorAngles[ringIndex] = angles;
// // // //                 activeSectorMaps[ringIndex] = activeSectors;
// // // //             }
// // // //         } else {
// // // //             const outerAngles = sectorAngles[ringIndex + 1];
// // // //             const outerActiveSectors = activeSectorMaps[ringIndex + 1];
// // // //             const innerSectors = sectors;
// // // //             const outerSectors = outerAngles.length;

// // // //             if (outerSectors === 0 || outerActiveSectors.length === 0) {
// // // //                 const uniformAngle = 2 * Math.PI / innerSectors;
// // // //                 sectorAngles[ringIndex] = Array(innerSectors).fill(uniformAngle);
// // // //                 activeSectorMaps[ringIndex] = Array.from({ length: innerSectors }, (_, i) => i);
// // // //                 continue;
// // // //             }

// // // //             const ratio = outerSectors / innerSectors;
// // // //             const angles = Array(innerSectors).fill(0);
// // // //             const activeSectors = [];

// // // //             for (let i = 0; i < innerSectors; i++) {
// // // //                 let sumAngle = 0;
// // // //                 let hasActiveChild = false;

// // // //                 for (let j = 0; j < ratio && (i * ratio + j) < outerSectors; j++) {
// // // //                     const outerIdx = Math.floor(i * ratio + j);
// // // //                     const outerAngle = outerAngles[outerIdx] || 0;
// // // //                     sumAngle += outerAngle;

// // // //                     if (outerActiveSectors.includes(outerIdx) && outerAngle > 0) {
// // // //                         hasActiveChild = true;
// // // //                     }
// // // //                 }

// // // //                 if (showEmptySectors || hasActiveChild || currentCounts[i] > 0) {
// // // //                     angles[i] = sumAngle || (2 * Math.PI / innerSectors);
// // // //                     if (hasActiveChild || currentCounts[i] > 0) {
// // // //                         activeSectors.push(i);
// // // //                     }
// // // //                 } else {
// // // //                     angles[i] = 0;
// // // //                 }
// // // //             }

// // // //             sectorAngles[ringIndex] = angles;
// // // //             activeSectorMaps[ringIndex] = activeSectors;
// // // //         }
// // // //     }

// // // //     console.log('Proportional angles calculation:', {
// // // //         showEmptySectors,
// // // //         sectorAngles: sectorAngles.map((angles, i) => ({
// // // //             ring: i,
// // // //             angles: angles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
// // // //             activeSectors: activeSectorMaps[i],
// // // //             totalAngle: (angles.reduce((sum, a) => sum + a, 0) * 180 / Math.PI).toFixed(2) + '°'
// // // //         }))
// // // //     });

// // // //     return sectorAngles;
// // // // };

// // // // export const generateRingStructure = (jsonData, transformStrategy = null, transformOptions = {}, labelsData = null) => {
// // // //     if (!jsonData) {
// // // //         console.error("No jsonData provided to generateRingStructure.");
// // // //         return [];
// // // //     }
// // // //     if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// // // //         console.log("=== GENERATING DECISION TREE RING STRUCTURE ===");
// // // //         const allPoints = Object.values(jsonData).flat();
// // // //         console.log(`Processing ${allPoints.length} points for decision tree`);
// // // //         const result = transformDecisionTree(allPoints, { ...transformOptions, labelsData });
// // // //         const { tree, transformedPoints } = result;

// // // //         if (!tree || !tree.levels || tree.levels.length === 0) {
// // // //             console.warn("No valid tree levels generated.");
// // // //             return [];
// // // //         }

// // // //         const rings = [];

// // // //         // Root ring (depth 0, single node)
// // // //         const rootPoints = transformedPoints.filter(p =>
// // // //             p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === 0)
// // // //         );

// // // //         rings.push({
// // // //             key: `TreeRoot`,
// // // //             points: rootPoints,
// // // //             dimensions: 1,
// // // //             subspaceId: `TreeRoot`,
// // // //             ringIndex: 0,
// // // //             sectors: 1, // Root has only 1 sector (whole circle)
// // // //             structure: result.structure,
// // // //             nodes: tree.levels[0] || [] // Root node(s)
// // // //         });

// // // //         // Rings for depths 1 to max depth
// // // //         for (let depth = 1; depth < tree.levels.length; depth++) {
// // // //             const nodes = tree.levels[depth];
// // // //             const sectors = nodes.length; // Number of nodes at this depth = number of sectors
// // // //             console.log(`Depth ${depth}: ${sectors} nodes/sectors`);

// // // //             const pointsInRing = transformedPoints.filter(p => {
// // // //                 return p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === depth);
// // // //             }).map(p => ({
// // // //                 ...p,
// // // //                 sectorIndex: p.nodeAssignments.find(assignment => assignment.depth === depth)?.nodeId
// // // //             }));

// // // //             rings.push({
// // // //                 key: `TreeDepth${depth}`,
// // // //                 points: pointsInRing,
// // // //                 dimensions: depth + 1,
// // // //                 subspaceId: `TreeDepth${depth}`,
// // // //                 ringIndex: depth,
// // // //                 sectors, // Number of nodes at this depth
// // // //                 structure: result.structure,
// // // //                 nodes: nodes // Store the actual nodes for reference
// // // //             });
// // // //         }

// // // //         console.log(`Generated ${rings.length} rings with sectors: ${rings.map(r => r.sectors).join(', ')}`);
// // // //         console.log(`Points per ring: ${rings.map(r => r.points.length).join(', ')}`);
// // // //         return rings;
// // // //     }
// // // //     const subspaces = Object.keys(jsonData);
// // // //     subspaces.sort((a, b) => a.length - b.length);

// // // //     return subspaces.map((key, index) => ({
// // // //         key,
// // // //         points: jsonData[key] || [],
// // // //         dimensions: key.length,
// // // //         subspaceId: key,
// // // //         ringIndex: index,
// // // //         sectors: transformStrategy === CoordinateTransforms.RADIAL ? 1 : 2 ** (index + 1)
// // // //     }));
// // // // };

// // // // // Color scheme generation
// // // // // export const generateColorSchemes = (ringCount) => {
// // // // //     const ringColorScale = d3.scaleSequential(d3.interpolatePlasma).domain([ringCount, 0]);

// // // // //     const getRingColor = (index) => d3.color(ringColorScale(index));

// // // // //     const getSectorColor = (ringIndex, sectorIndex) => {
// // // // //         const baseColor = d3.hsl(getRingColor(ringIndex));
// // // // //         const isPositive = sectorIndex % 2 === 0;
// // // // //         return d3.hsl(baseColor.h, baseColor.s, isPositive ? 0.75 : 0.35).toString();
// // // // //     };

// // // // //     return { getRingColor, getSectorColor };
// // // // // };

// // // // export const generateColorSchemes = (ringCount) => {
// // // //     // 1. Keep ring color same for all the rings, and make it whitish yellowish.
// // // //     // We'll use a fixed color, such as a light yellow/gold.
// // // //     const fixedRingColor = "#f6e9a8"; // A light, slightly yellow/gold color

// // // //     // The getRingColor function now returns the fixed color regardless of the index.
// // // //     const getRingColor = (index) => fixedRingColor;

// // // //     // 2. The sector saturation should remain same as dark and light.
// // // //     // We use the fixed color as the base for sector calculation.
// // // //     const baseColorForSectors = d3.hsl(fixedRingColor);

// // // //     const getSectorColor = (ringIndex, sectorIndex) => {
// // // //         // baseColor remains the fixed yellow/gold, ensuring all rings use the same base hue/saturation
// // // //         const isPositive = sectorIndex % 2 === 0;

// // // //         // The logic for dark (0.35) and light (0.75) sectors is preserved.
// // // //         // We use the hue and saturation of the fixed color, but vary the lightness (l).
// // // //         return d3.hsl(baseColorForSectors.h, baseColorForSectors.s, isPositive ? 0.90 : 0.80).toString();
// // // //     };

// // // //     return { getRingColor, getSectorColor };
// // // // };

// // // // export const calculatePointPositions = (
// // // //     points,
// // // //     ringIndex,
// // // //     innerRadius,
// // // //     outerRadius,
// // // //     sectors,
// // // //     sectorAngles = null,
// // // //     viewMode = 'normal',
// // // //     showEmptySectors = true,
// // // //     transformStrategy = CoordinateTransforms.POSITIVE_NEGATIVE,
// // // //     transformOptions = {},
// // // //     ring = null
// // // // ) => {
// // // //     try {
// // // //         let transformedPoints = points;
// // // //         if (transformStrategy !== CoordinateTransforms.DECISION_TREE) {
// // // //             transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
// // // //         }

// // // //         const rotationOffset = 0;
// // // //         const positions = [];
// // // //         if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// // // //             if (ringIndex === 0) {
// // // //                 // ROOT RING (INNER CIRCLE) - Place all points in the center
// // // //                 console.log(`Root ring (depth 0): Positioning ${points.length} points in inner circle`);

// // // //                 const centerRadius = (innerRadius + outerRadius) / 2;
// // // //                 const numPoints = points.length;

// // // //                 if (numPoints === 1) {
// // // //                     // Single point at the center
// // // //                     positions.push({
// // // //                         point: points[0],
// // // //                         x: 0,
// // // //                         y: 0,
// // // //                         sectorIndex: 0,
// // // //                         angle: 0,
// // // //                         nodeId: 0
// // // //                     });
// // // //                 } else {
// // // //                     // Multiple points arranged in a circle
// // // //                     points.forEach((point, idx) => {
// // // //                         const angle = (2 * Math.PI * idx) / numPoints;
// // // //                         // Add some random variation to avoid exact overlap
// // // //                         const radiusVariation = (Math.random() - 0.5) * (outerRadius - innerRadius) * 0.3;
// // // //                         const radius = Math.max(innerRadius, Math.min(outerRadius, centerRadius + radiusVariation));

// // // //                         const x = radius * Math.cos(angle);
// // // //                         const y = radius * Math.sin(angle);

// // // //                         positions.push({
// // // //                             point,
// // // //                             x,
// // // //                             y,
// // // //                             sectorIndex: 0,
// // // //                             angle,
// // // //                             nodeId: 0
// // // //                         });
// // // //                     });
// // // //                 }

// // // //                 console.log(`Root ring: ${positions.length} points positioned in center circle`);
// // // //                 return positions;
// // // //             }

// // // //             // OUTER RINGS (depth > 0) - Place points in sectors based on tree structure
// // // //             const pointsByNode = {};
// // // //             transformedPoints.forEach((point, pointIndex) => {
// // // //                 if (!point.nodeAssignments) {
// // // //                     console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// // // //                     return;
// // // //                 }

// // // //                 const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// // // //                 if (!assignment) {
// // // //                     console.warn(`No assignment for point ${point.Point_ID} at depth ${ringIndex}`);
// // // //                     return;
// // // //                 }

// // // //                 const nodeId = assignment.nodeId;
// // // //                 if (!pointsByNode[nodeId]) {
// // // //                     pointsByNode[nodeId] = [];
// // // //                 }
// // // //                 pointsByNode[nodeId].push({ point, pointIndex, assignment });
// // // //             });

// // // //             // Process each node/sector
// // // //             Object.entries(pointsByNode).forEach(([nodeId, nodePoints]) => {
// // // //                 const assignment = nodePoints[0].assignment;
// // // //                 const sector = assignment.sector;

// // // //                 if (!sector) {
// // // //                     console.warn(`No sector info for node ${nodeId} at depth ${ringIndex}`);
// // // //                     return;
// // // //                 }

// // // //                 // Calculate the center angle of the sector
// // // //                 const sectorCenterAngle = (sector.startAngle + sector.endAngle) / 2;
// // // //                 const numPoints = nodePoints.length;

// // // //                 // Place points in the sector
// // // //                 nodePoints.forEach(({ point, pointIndex, assignment }, idx) => {
                  
// // // //                     let radius;
// // // //                     let angle = sectorCenterAngle;

// // // //                     if (numPoints === 1) {
// // // //                         // Single point goes in the middle of the ring
// // // //                         radius = (innerRadius + outerRadius) / 2;
// // // //                     } else if (numPoints <= 3) {
// // // //                         // Few points: distribute radially
// // // //                         const radiusSpan = outerRadius - innerRadius;
// // // //                         const t = idx / Math.max(1, numPoints - 1);
// // // //                         radius = innerRadius + (t * radiusSpan);
// // // //                     } else {
// // // //                         // Many points: arrange in arc within the sector
// // // //                         const radiusSpan = outerRadius - innerRadius;
// // // //                         const radialLayers = Math.ceil(Math.sqrt(numPoints));
// // // //                         const pointsPerLayer = Math.ceil(numPoints / radialLayers);

// // // //                         const layerIndex = Math.floor(idx / pointsPerLayer);
// // // //                         const positionInLayer = idx % pointsPerLayer;

// // // //                         // Radius for this layer
// // // //                         radius = innerRadius + (layerIndex / Math.max(1, radialLayers - 1)) * radiusSpan;

// // // //                         // Angle variation within sector
// // // //                         const sectorWidth = sector.endAngle - sector.startAngle;
// // // //                         const maxAngleSpread = Math.min(sectorWidth * 0.8, Math.PI / 6); // Limit spread

// // // //                         if (pointsPerLayer > 1) {
// // // //                             const angleOffset = (positionInLayer / (pointsPerLayer - 1) - 0.5) * maxAngleSpread;
// // // //                             angle = sectorCenterAngle + angleOffset;
// // // //                         }
// // // //                     }

// // // //                     // Convert polar coordinates to Cartesian
// // // //                     const x = radius * Math.cos(angle);
// // // //                     const y = radius * Math.sin(angle);

// // // //                     if (isNaN(x) || isNaN(y)) {
// // // //                         console.warn(`Invalid position for point ${point.Point_ID} at node ${nodeId}`);
// // // //                         return;
// // // //                     }

// // // //                     positions.push({
// // // //                         point,
// // // //                         x,
// // // //                         y,
// // // //                         sectorIndex: parseInt(nodeId),
// // // //                         angle,
// // // //                         nodeId: parseInt(nodeId)
// // // //                     });
// // // //                 });
// // // //             });

// // // //             console.log(`Ring ${ringIndex}: ${positions.length} points positioned across ${sectors} sectors`);

// // // //         } else if (transformStrategy === CoordinateTransforms.RADIAL) {
// // // //             // [Unchanged RADIAL case]
// // // //             const effectiveInnerRadius = ringIndex === 0 ? 20 : innerRadius;
// // // //             const effectiveOuterRadius = ringIndex === 0 ? 60 : outerRadius;
// // // //             const centralRadius = (effectiveInnerRadius + effectiveOuterRadius) / 2;

// // // //             const angleGroups = {};
// // // //             transformedPoints.forEach((point, pointIndex) => {
// // // //                 const angle = point.angle !== undefined ? point.angle + rotationOffset : rotationOffset;
// // // //                 const angleKey = angle.toFixed(8);
// // // //                 if (!angleGroups[angleKey]) {
// // // //                     angleGroups[angleKey] = [];
// // // //                 }
// // // //                 angleGroups[angleKey].push({ point, pointIndex, angle });
// // // //             });

// // // //             Object.values(angleGroups).forEach(group => {
// // // //                 const numCoinciding = group.length;
// // // //                 group.forEach(({ point, pointIndex, angle }, index) => {
// // // //                     const originalPoint = points[pointIndex];

// // // //                     let radius = centralRadius;
// // // //                     if (numCoinciding > 1) {
// // // //                         const offsetStep = 3;
// // // //                         const offset = ((index - (numCoinciding - 1) / 2) * offsetStep);
// // // //                         radius += offset;
// // // //                     }

// // // //                     radius = Math.max(effectiveInnerRadius, Math.min(effectiveOuterRadius, radius));

// // // //                     const x = radius * Math.cos(angle);
// // // //                     const y = radius * Math.sin(angle);

// // // //                     if (isNaN(x) || isNaN(y)) {
// // // //                         console.warn(`Invalid position for point ${point.Point_ID}`);
// // // //                         return;
// // // //                     }

// // // //                     positions.push({
// // // //                         point: originalPoint,
// // // //                         transformedPoint: point,
// // // //                         x,
// // // //                         y,
// // // //                         sectorIndex: 0,
// // // //                         angle
// // // //                     });
// // // //                 });
// // // //             });
// // // //         } else if (viewMode === 'normal') {
// // // //             // [Unchanged normal view mode case]
// // // //             const sectorCounts = Array(sectors).fill(0);
// // // //             const pointsBySector = {};

// // // //             transformedPoints.forEach((point, pointIndex) => {
// // // //                 try {
// // // //                     const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
// // // //                     if (sectorIndex >= 0 && sectorIndex < sectors) {
// // // //                         sectorCounts[sectorIndex]++;
// // // //                         if (!pointsBySector[sectorIndex]) {
// // // //                             pointsBySector[sectorIndex] = [];
// // // //                         }
// // // //                         pointsBySector[sectorIndex].push({
// // // //                             point: points[pointIndex],
// // // //                             transformedPoint: point,
// // // //                             pointIndex
// // // //                         });
// // // //                     }
// // // //                 } catch (error) {
// // // //                     console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// // // //                 }
// // // //             });

// // // //             const sectorsToRender = showEmptySectors ?
// // // //                 Array.from({ length: sectors }, (_, i) => i) :
// // // //                 Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

// // // //             const anglePerSector = 2 * Math.PI / (showEmptySectors ? sectors : sectorsToRender.length);

// // // //             Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
// // // //                 const sectorIdx = parseInt(sectorIndex);

// // // //                 let displayIndex = sectorIdx;
// // // //                 if (!showEmptySectors) {
// // // //                     displayIndex = sectorsToRender.indexOf(sectorIdx);
// // // //                     if (displayIndex === -1) return;
// // // //                 }

// // // //                 const startAngle = (anglePerSector * displayIndex) + rotationOffset;
// // // //                 const centerAngle = startAngle + (anglePerSector / 2);

// // // //                 sectorPoints.forEach(({ point, transformedPoint }, pointIndex) => {
// // // //                     const clusterFactor = 0.9;
// // // //                     const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * pointIndex) / Math.max(1, sectorPoints.length);

// // // //                     const x = radius * Math.cos(centerAngle);
// // // //                     const y = radius * Math.sin(centerAngle);

// // // //                     positions.push({
// // // //                         point,
// // // //                         transformedPoint,
// // // //                         x,
// // // //                         y,
// // // //                         sectorIndex: sectorIdx,
// // // //                         angle: centerAngle
// // // //                     });
// // // //                 });
// // // //             });
// // // //         } else if (viewMode === 'proportional' && sectorAngles) {
// // // //             // [Unchanged proportional view mode case]
// // // //             const pointsBySector = {};
// // // //             transformedPoints.forEach((point, index) => {
// // // //                 try {
// // // //                     const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
// // // //                     if (!pointsBySector[sectorIndex]) {
// // // //                         pointsBySector[sectorIndex] = [];
// // // //                     }
// // // //                     pointsBySector[sectorIndex].push({ point: points[index], transformedPoint: point, index });
// // // //                 } catch (error) {
// // // //                     console.error(`Error grouping point ${point.Point_ID} by sector:`, error);
// // // //                 }
// // // //             });

// // // //             let currentAngle = rotationOffset;
// // // //             const startAngles = sectorAngles.map((angle) => {
// // // //                 const start = currentAngle;
// // // //                 currentAngle += angle;
// // // //                 return start;
// // // //             });

// // // //             Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
// // // //                 const sectorIdx = parseInt(sectorIndex);
// // // //                 const sectorAngle = sectorAngles[sectorIdx];

// // // //                 if (!showEmptySectors && sectorAngle === 0) {
// // // //                     return;
// // // //                 }

// // // //                 if (sectorAngle < 0.01) {
// // // //                     return;
// // // //                 }

// // // //                 const startAngle = startAngles[sectorIdx];
// // // //                 const centerAngle = startAngle + (sectorAngle / 2);

// // // //                 sectorPoints.forEach(({ point, transformedPoint, index }, i) => {
// // // //                     const clusterFactor = 0.9;
// // // //                     const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * i) / Math.max(1, sectorPoints.length);

// // // //                     const x = radius * Math.cos(centerAngle);
// // // //                     const y = radius * Math.sin(centerAngle);

// // // //                     positions.push({
// // // //                         point,
// // // //                         transformedPoint,
// // // //                         x,
// // // //                         y,
// // // //                         sectorIndex: sectorIdx,
// // // //                         angle: centerAngle
// // // //                     });
// // // //                 });
// // // //             });
// // // //         }

// // // //         console.log(`Calculated ${positions.length} positions for ring ${ringIndex} using ${transformStrategy}`);
// // // //         return positions;
// // // //     } catch (error) {
// // // //         console.error(`Error in calculatePointPositions for ring ${ringIndex}:`, error);
// // // //         return [];
// // // //     }
// // // // };

// // // // // Export all transformation functions for backward compatibility
// // // // export {
// // // //     transformPositiveNegative,
// // // //     transformZScore,
// // // //     transformPercentile,
// // // //     transformCustomThreshold,
// // // //     transformRadial,
// // // //     transformDecisionTree
// // // // };

// // // import * as d3 from "d3";

// // // import { transformPositiveNegative } from './options/PosNeg.js';
// // // import { transformZScore } from './options/zScore.js';
// // // import { transformPercentile } from './options/Percentile.js';
// // // import { transformCustomThreshold } from './options/CustomThreshold.js';
// // // import { transformRadial } from './options/Radial.js';
// // // import { transformDecisionTree } from "./options/DecisionTree.js";

// // // export const CoordinateTransforms = {
// // //     POSITIVE_NEGATIVE: 'positive_negative',
// // //     Z_SCORE: 'z_score',
// // //     PERCENTILE: 'percentile',
// // //     CUSTOM_THRESHOLD: 'custom_threshold',
// // //     RADIAL: 'radial',
// // //     DECISION_TREE: 'decision_tree'
// // // };


// // // export const transformCoordinates = (points, strategy, options = {}) => {
// // //     try {
// // //         switch (strategy) {
// // //             case CoordinateTransforms.POSITIVE_NEGATIVE:
// // //                 return transformPositiveNegative(points);
// // //             case CoordinateTransforms.Z_SCORE:
// // //                 return transformZScore(points, options.threshold || 0);
// // //             case CoordinateTransforms.PERCENTILE:
// // //                 return transformPercentile(points, options.percentile || 50);
// // //             case CoordinateTransforms.CUSTOM_THRESHOLD:
// // //                 return transformCustomThreshold(points, options.threshold || 0);
// // //             case CoordinateTransforms.RADIAL:
// // //                 return transformRadial(points, options);
// // //             case CoordinateTransforms.DECISION_TREE:
// // //                 return transformDecisionTree(points, options);
// // //             default:
// // //                 console.warn(`Unknown transformation strategy: ${strategy}, using positive_negative`);
// // //                 return transformPositiveNegative(points);
// // //         }
// // //     } catch (error) {
// // //         console.error(`Error in coordinate transformation (${strategy}):`, error);
// // //         console.warn('Falling back to positive_negative transformation');
// // //         return transformPositiveNegative(points);
// // //     }
// // // };

// // // // Enhanced bit vector generation with decision tree support
// // // export const generateBitVector = (point, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
// // //     let coordinates;

// // //     if (strategy === CoordinateTransforms.DECISION_TREE) {
// // //         if (useTransformed && point.nodeAssignments) {
// // //             // Use node path to create binary vector
// // //             const binaryPath = point.nodeAssignments.map((assignment, index) => {
// // //                 return (assignment.nodeId % 2).toString();
// // //             }).join('');
// // //             return binaryPath || '0';
// // //         } else {
// // //             coordinates = Object.entries(point).filter(([key, value]) =>
// // //                 key !== "Point_ID" &&
// // //                 key !== "nodeAssignments" &&
// // //                 key !== "treePath" &&
// // //                 key !== "predicted_class" &&
// // //                 key !== "nodePath" &&
// // //                 key !== "decisionPath" &&
// // //                 key !== "finalSector" &&
// // //                 typeof value === 'number' &&
// // //                 !isNaN(value)
// // //             );
// // //         }
// // //     } else {
// // //         coordinates = Object.entries(point).filter(([key]) => {
// // //             if (useTransformed) {
// // //                 return key.endsWith('_binary');
// // //             }
// // //             return key !== "Point_ID" && !key.endsWith('_binary');
// // //         });
// // //     }

// // //     if (!coordinates || coordinates.length === 0) {
// // //         console.warn(`No coordinates found for point ${point.Point_ID} with strategy ${strategy}, useTransformed: ${useTransformed}`);
// // //         coordinates = Object.entries(point).filter(([key, value]) =>
// // //             key !== "Point_ID" &&
// // //             typeof value === 'number' &&
// // //             !isNaN(value)
// // //         );
// // //     }

// // //     let bitVector;
// // //     if (useTransformed && strategy === CoordinateTransforms.DECISION_TREE) {
// // //         bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
// // //     } else if (useTransformed) {
// // //         bitVector = coordinates.map(([_, value]) => String(value)).join("");
// // //     } else {
// // //         bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
// // //     }

// // //     return bitVector || '0';
// // // };

// // // // Enhanced sector point counts calculation with decision tree support
// // // export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {
// // //     if (transformStrategy === CoordinateTransforms.RADIAL) {
// // //         return pointsData.map(ringData => [ringData.points.length]);
// // //     }


// // //     if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// // //         // For decision tree, calculate counts based on nodes at each depth
// // //         return pointsData.map((ringData, ringIndex) => {
// // //             try {
// // //                 const sectors = ringData.sectors || ringData.nodes?.length || 1;
// // //                 const counts = Array(sectors).fill(0);

// // //                 (ringData.points || []).forEach(point => {
// // //                     try {
// // //                         if (point.nodeAssignments) {
// // //                             const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// // //                             if (assignment) {
// // //                                 // Use sectorIndex instead of nodeId
// // //                                 const sectorIndex = assignment.sectorIndex !== undefined ? assignment.sectorIndex : assignment.nodeId;

// // //                                 if (sectorIndex >= 0 && sectorIndex < sectors) {
// // //                                     counts[sectorIndex]++;
// // //                                 } else {
// // //                                     console.warn(`Invalid sectorIndex ${sectorIndex} for point ${point.Point_ID} at depth ${ringIndex} (max sectors: ${sectors})`);
// // //                                 }
// // //                             } else {
// // //                                 console.warn(`No assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
// // //                             }
// // //                         } else {
// // //                             console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// // //                         }
// // //                     } catch (error) {
// // //                         console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// // //                     }
// // //                 });
// // //                 console.log("calculate sector point function here")
// // //                 console.log(`Ring ${ringIndex} (Decision Tree): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} nodes`);
// // //                 return counts;
// // //             } catch (error) {
// // //                 console.error(`Error processing ring ${ringIndex} with decision tree:`, error);
// // //                 return Array(ringData.sectors || 1).fill(0);
// // //             }
// // //         });
// // //     }

// // //     return pointsData.map((ringData, index) => {
// // //         try {
// // //             let pointsToCount = ringData.points;
// // //             pointsToCount = transformCoordinates(ringData.points, transformStrategy, transformOptions);

// // //             const sectors = ringData.sectors || 2 ** (index + 1);
// // //             const counts = Array(sectors).fill(0);

// // //             pointsToCount.forEach(point => {
// // //                 try {
// // //                     const sectorIndex = calculateSectorIndex(point, index, true, transformStrategy);
// // //                     if (sectorIndex >= 0 && sectorIndex < sectors) {
// // //                         counts[sectorIndex]++;
// // //                     } else {
// // //                         console.warn(`Invalid sector index ${sectorIndex} for point ${point.Point_ID} in ring ${index}`);
// // //                     }
// // //                 } catch (error) {
// // //                     console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// // //                 }
// // //             });

// // //             console.log(`Ring ${index} (${transformStrategy}): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} sectors`);
// // //             return counts;
// // //         } catch (error) {
// // //             console.error(`Error processing ring ${index} with strategy ${transformStrategy}:`, error);
// // //             const sectors = 2 ** (index + 1);
// // //             return Array(sectors).fill(0);
// // //         }
// // //     });
// // // };

// // // // Enhanced sector index calculation with decision tree support
// // // export const calculateSectorIndex = (point, ringIndex, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
// // //     if (strategy === CoordinateTransforms.DECISION_TREE) {
// // //         if (point.nodeAssignments) {
// // //             const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// // //             if (assignment) {
// // //                 return assignment.nodeId;
// // //             }
// // //             console.warn(`No node assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
// // //         } else {
// // //             console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// // //         }
// // //         return 0;
// // //     }

// // //     const bitVector = generateBitVector(point, useTransformed, strategy);

// // //     if (bitVector.length === 0) {
// // //         console.warn(`Empty bit vector for point ${point.Point_ID}, returning sector 0`);
// // //         return 0;
// // //     }

// // //     const sectors = 2 ** (ringIndex + 1);
// // //     const binaryValue = parseInt(bitVector, 2) || 0;
// // //     const sectorIndex = Math.min(binaryValue, sectors - 1);

// // //     return sectorIndex;
// // // };
// // // // Helper function to get active sector mapping for point positioning
// // // export const getActiveSectorMapping = (sectorCounts, showEmptySectors = true) => {
// // //     const activeMaps = [];

// // //     sectorCounts.forEach((counts, ringIndex) => {
// // //         if (showEmptySectors) {
// // //             activeMaps[ringIndex] = Array.from({ length: counts.length }, (_, i) => i);
// // //         } else {
// // //             activeMaps[ringIndex] = counts
// // //                 .map((count, index) => count > 0 ? index : -1)
// // //                 .filter(index => index !== -1);
// // //         }
// // //     });

// // //     return activeMaps;
// // // };

// // // // Fixed proportional sector angles calculation that maintains hierarchical structure
// // // export const calculateProportionalSectorAngles = (sectorCounts, showEmptySectors = true) => {
// // //     const sectorAngles = [];
// // //     const lastRingIndex = sectorCounts.length - 1;

// // //     const activeSectorMaps = [];

// // //     for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
// // //         const currentCounts = sectorCounts[ringIndex];
// // //         const sectors = currentCounts.length;

// // //         if (sectors === 1) {
// // //             sectorAngles[ringIndex] = [359 * Math.PI / 180];
// // //             activeSectorMaps[ringIndex] = [0];
// // //             continue;
// // //         }

// // //         const totalPoints = currentCounts.reduce((sum, count) => sum + count, 0) || 1;
// // //         const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

// // //         if (ringIndex === lastRingIndex) {
// // //             if (showEmptySectors) {
// // //                 const emptySectors = currentCounts.filter(count => count === 0).length;
// // //                 const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

// // //                 const angles = currentCounts.map(count => {
// // //                     return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
// // //                 });

// // //                 sectorAngles[ringIndex] = angles;
// // //                 activeSectorMaps[ringIndex] = Array.from({ length: sectors }, (_, i) => i);
// // //             } else {
// // //                 const activeSectors = [];
// // //                 const activeAngles = [];

// // //                 currentCounts.forEach((count, index) => {
// // //                     if (count > 0) {
// // //                         activeSectors.push(index);
// // //                         activeAngles.push((count / totalPoints) * 2 * Math.PI);
// // //                     }
// // //                 });

// // //                 const angles = Array(sectors).fill(0);
// // //                 activeSectors.forEach((sectorIndex, i) => {
// // //                     angles[sectorIndex] = activeAngles[i];
// // //                 });

// // //                 sectorAngles[ringIndex] = angles;
// // //                 activeSectorMaps[ringIndex] = activeSectors;
// // //             }
// // //         } else {
// // //             const outerAngles = sectorAngles[ringIndex + 1];
// // //             const outerActiveSectors = activeSectorMaps[ringIndex + 1];
// // //             const innerSectors = sectors;
// // //             const outerSectors = outerAngles.length;

// // //             if (outerSectors === 0 || outerActiveSectors.length === 0) {
// // //                 const uniformAngle = 2 * Math.PI / innerSectors;
// // //                 sectorAngles[ringIndex] = Array(innerSectors).fill(uniformAngle);
// // //                 activeSectorMaps[ringIndex] = Array.from({ length: innerSectors }, (_, i) => i);
// // //                 continue;
// // //             }

// // //             const ratio = outerSectors / innerSectors;
// // //             const angles = Array(innerSectors).fill(0);
// // //             const activeSectors = [];

// // //             for (let i = 0; i < innerSectors; i++) {
// // //                 let sumAngle = 0;
// // //                 let hasActiveChild = false;

// // //                 for (let j = 0; j < ratio && (i * ratio + j) < outerSectors; j++) {
// // //                     const outerIdx = Math.floor(i * ratio + j);
// // //                     const outerAngle = outerAngles[outerIdx] || 0;
// // //                     sumAngle += outerAngle;

// // //                     if (outerActiveSectors.includes(outerIdx) && outerAngle > 0) {
// // //                         hasActiveChild = true;
// // //                     }
// // //                 }

// // //                 if (showEmptySectors || hasActiveChild || currentCounts[i] > 0) {
// // //                     angles[i] = sumAngle || (2 * Math.PI / innerSectors);
// // //                     if (hasActiveChild || currentCounts[i] > 0) {
// // //                         activeSectors.push(i);
// // //                     }
// // //                 } else {
// // //                     angles[i] = 0;
// // //                 }
// // //             }

// // //             sectorAngles[ringIndex] = angles;
// // //             activeSectorMaps[ringIndex] = activeSectors;
// // //         }
// // //     }

// // //     console.log('Proportional angles calculation:', {
// // //         showEmptySectors,
// // //         sectorAngles: sectorAngles.map((angles, i) => ({
// // //             ring: i,
// // //             angles: angles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
// // //             activeSectors: activeSectorMaps[i],
// // //             totalAngle: (angles.reduce((sum, a) => sum + a, 0) * 180 / Math.PI).toFixed(2) + '°'
// // //         }))
// // //     });

// // //     return sectorAngles;
// // // };

// // // export const generateRingStructure = (jsonData, transformStrategy = null, transformOptions = {}, labelsData = null) => {
// // //     if (!jsonData) {
// // //         console.error("No jsonData provided to generateRingStructure.");
// // //         return [];
// // //     }
// // //     if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// // //         console.log("=== GENERATING DECISION TREE RING STRUCTURE ===");
// // //         const allPoints = Object.values(jsonData).flat();
// // //         console.log(`Processing ${allPoints.length} points for decision tree`);
// // //         const result = transformDecisionTree(allPoints, { ...transformOptions, labelsData });
// // //         const { tree, transformedPoints } = result;

// // //         if (!tree || !tree.levels || tree.levels.length === 0) {
// // //             console.warn("No valid tree levels generated.");
// // //             return [];
// // //         }

// // //         const rings = [];

// // //         // Root ring (depth 0, single node)
// // //         const rootPoints = transformedPoints.filter(p =>
// // //             p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === 0)
// // //         );

// // //         rings.push({
// // //             key: `TreeRoot`,
// // //             points: rootPoints,
// // //             dimensions: 1,
// // //             subspaceId: `TreeRoot`,
// // //             ringIndex: 0,
// // //             sectors: 1, // Root has only 1 sector (whole circle)
// // //             structure: result.structure,
// // //             nodes: tree.levels[0] || [] // Root node(s)
// // //         });

// // //         // Rings for depths 1 to max depth
// // //         for (let depth = 1; depth < tree.levels.length; depth++) {
// // //             const nodes = tree.levels[depth];
// // //             const sectors = nodes.length; // Number of nodes at this depth = number of sectors
// // //             console.log(`Depth ${depth}: ${sectors} nodes/sectors`);

// // //             const pointsInRing = transformedPoints.filter(p => {
// // //                 return p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === depth);
// // //             }).map(p => ({
// // //                 ...p,
// // //                 sectorIndex: p.nodeAssignments.find(assignment => assignment.depth === depth)?.nodeId
// // //             }));

// // //             rings.push({
// // //                 key: `TreeDepth${depth}`,
// // //                 points: pointsInRing,
// // //                 dimensions: depth + 1,
// // //                 subspaceId: `TreeDepth${depth}`,
// // //                 ringIndex: depth,
// // //                 sectors, // Number of nodes at this depth
// // //                 structure: result.structure,
// // //                 nodes: nodes // Store the actual nodes for reference
// // //             });
// // //         }

// // //         console.log(`Generated ${rings.length} rings with sectors: ${rings.map(r => r.sectors).join(', ')}`);
// // //         console.log(`Points per ring: ${rings.map(r => r.points.length).join(', ')}`);
// // //         return rings;
// // //     }
// // //     const subspaces = Object.keys(jsonData);
// // //     subspaces.sort((a, b) => a.length - b.length);

// // //     return subspaces.map((key, index) => ({
// // //         key,
// // //         points: jsonData[key] || [],
// // //         dimensions: key.length,
// // //         subspaceId: key,
// // //         ringIndex: index,
// // //         sectors: transformStrategy === CoordinateTransforms.RADIAL ? 1 : 2 ** (index + 1)
// // //     }));
// // // };

// // // // Color scheme generation
// // // export const generateColorSchemes = (ringCount) => {
// // //     // 1. Keep ring color same for all the rings, and make it whitish yellowish.
// // //     const fixedRingColor = "#f6e9a8"; // A light, slightly yellow/gold color

// // //     // The getRingColor function now returns the fixed color regardless of the index.
// // //     const getRingColor = (index) => fixedRingColor;

// // //     // 2. The sector saturation should remain same as dark and light.
// // //     // We use the fixed color as the base for sector calculation.
// // //     const baseColorForSectors = d3.hsl(fixedRingColor);

// // //     const getSectorColor = (ringIndex, sectorIndex) => {
// // //         // baseColor remains the fixed yellow/gold, ensuring all rings use the same base hue/saturation
// // //         const isPositive = sectorIndex % 2 === 0;

// // //         // The logic for dark (0.35) and light (0.75) sectors is preserved.
// // //         // We use the hue and saturation of the fixed color, but vary the lightness (l).
// // //         return d3.hsl(baseColorForSectors.h, baseColorForSectors.s, isPositive ? 0.90 : 0.80).toString();
// // //     };

// // //     return { getRingColor, getSectorColor };
// // // };

// // // export const calculatePointPositions = (
// // //     points,
// // //     ringIndex,
// // //     innerRadius,
// // //     outerRadius,
// // //     sectors,
// // //     sectorAngles = null,
// // //     viewMode = 'normal',
// // //     showEmptySectors = true,
// // //     transformStrategy = CoordinateTransforms.POSITIVE_NEGATIVE,
// // //     transformOptions = {},
// // //     ring = null
// // // ) => {
// // //     try {
// // //         let transformedPoints = points;
// // //         if (transformStrategy !== CoordinateTransforms.DECISION_TREE) {
// // //             transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
// // //         }

// // //         const rotationOffset = 0;
// // //         const positions = [];
// // //         if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// // //             if (ringIndex === 0) {
// // //                 // ROOT RING (INNER CIRCLE) - Place all points in the center
// // //                 console.log(`Root ring (depth 0): Positioning ${points.length} points in inner circle`);

// // //                 const centerRadius = (innerRadius + outerRadius) / 2;
// // //                 const numPoints = points.length;

// // //                 if (numPoints === 1) {
// // //                     // Single point at the center
// // //                     positions.push({
// // //                         point: points[0],
// // //                         x: 0,
// // //                         y: 0,
// // //                         sectorIndex: 0,
// // //                         angle: 0,
// // //                         nodeId: 0
// // //                     });
// // //                 } else {
// // //                     // Multiple points arranged in a circle
// // //                     points.forEach((point, idx) => {
// // //                         const angle = (2 * Math.PI * idx) / numPoints;
// // //                         // Add some random variation to avoid exact overlap
// // //                         const radiusVariation = (Math.random() - 0.5) * (outerRadius - innerRadius) * 0.3;
// // //                         const radius = Math.max(innerRadius, Math.min(outerRadius, centerRadius + radiusVariation));

// // //                         const x = radius * Math.cos(angle);
// // //                         const y = radius * Math.sin(angle);

// // //                         positions.push({
// // //                             point,
// // //                             x,
// // //                             y,
// // //                             sectorIndex: 0,
// // //                             angle,
// // //                             nodeId: 0
// // //                         });
// // //                     });
// // //                 }

// // //                 console.log(`Root ring: ${positions.length} points positioned in center circle`);
// // //                 return positions;
// // //             }

// // //             // OUTER RINGS (depth > 0) - Place points in sectors based on tree structure
// // //             const pointsByNode = {};
// // //             transformedPoints.forEach((point, pointIndex) => {
// // //                 if (!point.nodeAssignments) {
// // //                     console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// // //                     return;
// // //                 }

// // //                 const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// // //                 if (!assignment) {
// // //                     console.warn(`No assignment for point ${point.Point_ID} at depth ${ringIndex}`);
// // //                     return;
// // //                 }

// // //                 const nodeId = assignment.nodeId;
// // //                 if (!pointsByNode[nodeId]) {
// // //                     pointsByNode[nodeId] = [];
// // //                 }
// // //                 pointsByNode[nodeId].push({ point, pointIndex, assignment });
// // //             });

// // //             // Process each node/sector
// // //             Object.entries(pointsByNode).forEach(([nodeId, nodePoints]) => {
// // //                 const assignment = nodePoints[0].assignment;
// // //                 const sector = assignment.sector;

// // //                 if (!sector) {
// // //                     console.warn(`No sector info for node ${nodeId} at depth ${ringIndex}`);
// // //                     return;
// // //                 }

// // //                 // Calculate the center angle of the sector
// // //                 const sectorCenterAngle = (sector.startAngle + sector.endAngle) / 2;
// // //                 const numPoints = nodePoints.length;

// // //                 // Place points in the sector
// // //                 nodePoints.forEach(({ point, pointIndex, assignment }, idx) => {

// // //                     let radius;
// // //                     let angle = sectorCenterAngle;

// // //                     if (numPoints === 1) {
// // //                         // Single point goes in the middle of the ring
// // //                         radius = (innerRadius + outerRadius) / 2;
// // //                     } else if (numPoints <= 3) {
// // //                         // Few points: distribute radially
// // //                         const radiusSpan = outerRadius - innerRadius;
// // //                         const t = idx / Math.max(1, numPoints - 1);
// // //                         radius = innerRadius + (t * radiusSpan);
// // //                     } else {
// // //                         // Many points: arrange in arc within the sector
// // //                         const radiusSpan = outerRadius - innerRadius;
// // //                         const radialLayers = Math.ceil(Math.sqrt(numPoints));
// // //                         const pointsPerLayer = Math.ceil(numPoints / radialLayers);

// // //                         const layerIndex = Math.floor(idx / pointsPerLayer);
// // //                         const positionInLayer = idx % pointsPerLayer;

// // //                         // Radius for this layer
// // //                         radius = innerRadius + (layerIndex / Math.max(1, radialLayers - 1)) * radiusSpan;

// // //                         // Angle variation within sector
// // //                         const sectorWidth = sector.endAngle - sector.startAngle;
// // //                         const maxAngleSpread = Math.min(sectorWidth * 0.8, Math.PI / 6); // Limit spread

// // //                         if (pointsPerLayer > 1) {
// // //                             const angleOffset = (positionInLayer / (pointsPerLayer - 1) - 0.5) * maxAngleSpread;
// // //                             angle = sectorCenterAngle + angleOffset;
// // //                         }
// // //                     }

// // //                     // Convert polar coordinates to Cartesian
// // //                     const x = radius * Math.cos(angle);
// // //                     const y = radius * Math.sin(angle);

// // //                     if (isNaN(x) || isNaN(y)) {
// // //                         console.warn(`Invalid position for point ${point.Point_ID} at node ${nodeId}`);
// // //                         return;
// // //                     }

// // //                     positions.push({
// // //                         point,
// // //                         x,
// // //                         y,
// // //                         sectorIndex: parseInt(nodeId),
// // //                         angle,
// // //                         nodeId: parseInt(nodeId)
// // //                     });
// // //                 });
// // //             });

// // //             console.log(`Ring ${ringIndex}: ${positions.length} points positioned across ${sectors} sectors`);

// // //         } else if (transformStrategy === CoordinateTransforms.RADIAL) {
// // //             // [Unchanged RADIAL case]
// // //             const effectiveInnerRadius = ringIndex === 0 ? 20 : innerRadius;
// // //             const effectiveOuterRadius = ringIndex === 0 ? 60 : outerRadius;
// // //             const centralRadius = (effectiveInnerRadius + effectiveOuterRadius) / 2;

// // //             const angleGroups = {};
// // //             transformedPoints.forEach((point, pointIndex) => {
// // //                 const angle = point.angle !== undefined ? point.angle + rotationOffset : rotationOffset;
// // //                 const angleKey = angle.toFixed(8);
// // //                 if (!angleGroups[angleKey]) {
// // //                     angleGroups[angleKey] = [];
// // //                 }
// // //                 angleGroups[angleKey].push({ point, pointIndex, angle });
// // //             });

// // //             Object.values(angleGroups).forEach(group => {
// // //                 const numCoinciding = group.length;
// // //                 group.forEach(({ point, pointIndex, angle }, index) => {
// // //                     const originalPoint = points[pointIndex];

// // //                     let radius = centralRadius;
// // //                     if (numCoinciding > 1) {
// // //                         const offsetStep = 3;
// // //                         const offset = ((index - (numCoinciding - 1) / 2) * offsetStep);
// // //                         radius += offset;
// // //                     }

// // //                     radius = Math.max(effectiveInnerRadius, Math.min(effectiveOuterRadius, radius));

// // //                     const x = radius * Math.cos(angle);
// // //                     const y = radius * Math.sin(angle);

// // //                     if (isNaN(x) || isNaN(y)) {
// // //                         console.warn(`Invalid position for point ${point.Point_ID}`);
// // //                         return;
// // //                     }

// // //                     positions.push({
// // //                         point: originalPoint,
// // //                         transformedPoint: point,
// // //                         x,
// // //                         y,
// // //                         sectorIndex: 0,
// // //                         angle
// // //                     });
// // //                 });
// // //             });
// // //         } else if (viewMode === 'normal') {
// // //             // [MODIFIED normal view mode case for horizontal/angular spread]
// // //             const sectorCounts = Array(sectors).fill(0);
// // //             const pointsBySector = {};

// // //             // 1. Group points by sector and calculate max magnitude in each sector
// // //             const D = ringIndex + 1;
// // //             const maxMagnitudes = {};

// // //             transformedPoints.forEach((point, pointIndex) => {
// // //                 try {
// // //                     const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
// // //                     if (sectorIndex >= 0 && sectorIndex < sectors) {
// // //                         sectorCounts[sectorIndex]++;
// // //                         if (!pointsBySector[sectorIndex]) {
// // //                             pointsBySector[sectorIndex] = [];
// // //                             maxMagnitudes[sectorIndex] = 1e-6; // Initialize with a small value
// // //                         }

// // //                         // Get the continuous values of the D features defining the sector (e.g., Z-scores).
// // //                         const relevantCoords = Object.entries(point)
// // //                             .filter(([key, value]) =>
// // //                                 key !== "Point_ID" &&
// // //                                 !key.endsWith('_binary') &&
// // //                                 typeof value === 'number'
// // //                             )
// // //                             .slice(0, D)
// // //                             .map(([_, value]) => value);

// // //                         let magnitude = 0;
// // //                         if (relevantCoords.length > 0) {
// // //                             magnitude = Math.sqrt(relevantCoords.reduce((sum, val) => sum + val * val, 0));
// // //                         }

// // //                         if (magnitude > maxMagnitudes[sectorIndex]) {
// // //                             maxMagnitudes[sectorIndex] = magnitude;
// // //                         }

// // //                         pointsBySector[sectorIndex].push({
// // //                             point: points[pointIndex],
// // //                             transformedPoint: point,
// // //                             magnitude: magnitude, // Store magnitude for later use
// // //                             pointIndex
// // //                         });
// // //                     }
// // //                 } catch (error) {
// // //                     console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// // //                 }
// // //             });

// // //             const sectorsToRender = showEmptySectors ?
// // //                 Array.from({ length: sectors }, (_, i) => i) :
// // //                 Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

// // //             const anglePerSector = 2 * Math.PI / (showEmptySectors ? sectors : sectorsToRender.length);

// // //             Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
// // //                 const sectorIdx = parseInt(sectorIndex);

// // //                 let displayIndex = sectorIdx;
// // //                 if (!showEmptySectors) {
// // //                     displayIndex = sectorsToRender.indexOf(sectorIdx);
// // //                     if (displayIndex === -1) return;
// // //                 }

// // //                 const startAngle = (anglePerSector * displayIndex) + rotationOffset;
// // //                 const endAngle = startAngle + anglePerSector;

// // //                 // Proxy for sector sign based on MSB:
// // //                 // If the most significant bit (MSB) of the sector index is 1, treat as "positive" direction.
// // //                 const isPositiveSector = sectorIdx >= (2 ** (D - 1));
// // //                 const maxMag = maxMagnitudes[sectorIdx];
// // //                 const radiusSpan = outerRadius - innerRadius;

// // //                 sectorPoints.forEach(({ point, transformedPoint, magnitude }, i) => {
// // //                     // --- STEP A & B: CALCULATE NORMALIZED VALUE (V_normalized) ---
// // //                     // V_raw: Normalized magnitude [0, 1]
// // //                     const V_raw = maxMag > 1e-6 ? magnitude / maxMag : 0.5;

// // //                     let V_normalized;
// // //                     if (isPositiveSector) {
// // //                         // Positive Sector: min value (0) -> startAngle, max value (1) -> endAngle
// // //                         // Corresponds to magnitude 0 -> start, magnitude max -> end.
// // //                         V_normalized = V_raw;
// // //                     } else {
// // //                         // Negative Sector: min value (-1) -> startAngle, max value (0) -> endAngle
// // //                         // Corresponds to magnitude max -> start, magnitude 0 -> end. (Reversed scale)
// // //                         V_normalized = 1.0 - V_raw;
// // //                     }


// // //                     // --- STEP C: CALCULATE ANGLE AND RADIUS ---

// // //                     // Angular position: Map V_normalized [0, 1] to the angular range [startAngle, endAngle]
// // //                     const angleSpreadFactor = 0.8; // Use 80% of the angle for spreading
// // //                     const angleMargin = anglePerSector * (1 - angleSpreadFactor) / 2;
// // //                     const angleSpan = anglePerSector * angleSpreadFactor;

// // //                     // The point's value is mapped to its horizontal position within the sector
// // //                     const angle = startAngle + angleMargin + (V_normalized * angleSpan);


// // //                     // Radial position: Use index (i) for vertical spread and slight jitter to prevent overlap.
// // //                     const verticalSpreadFactor = i / Math.max(1, sectorPoints.length); // 0 to 1 based on index
// // //                     const radialJitter = (Math.random() - 0.5) * radiusSpan * 0.1; // Small random jitter

// // //                     // Spread radially based on index to avoid total overlap
// // //                     const radius = innerRadius + radiusSpan * (0.1 + verticalSpreadFactor * 0.8) + radialJitter;


// // //                     const x = radius * Math.cos(angle);
// // //                     const y = radius * Math.sin(angle);

// // //                     positions.push({
// // //                         point,
// // //                         transformedPoint,
// // //                         x,
// // //                         y,
// // //                         sectorIndex: sectorIdx,
// // //                         angle: angle
// // //                     });
// // //                 });
// // //             });
// // //         } else if (viewMode === 'proportional' && sectorAngles) {
// // //             // [Unchanged proportional view mode case]
// // //             const pointsBySector = {};
// // //             transformedPoints.forEach((point, index) => {
// // //                 try {
// // //                     const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
// // //                     if (!pointsBySector[sectorIndex]) {
// // //                         pointsBySector[sectorIndex] = [];
// // //                     }
// // //                     pointsBySector[sectorIndex].push({ point: points[index], transformedPoint: point, index });
// // //                 } catch (error) {
// // //                     console.error(`Error grouping point ${point.Point_ID} by sector:`, error);
// // //                 }
// // //             });

// // //             let currentAngle = rotationOffset;
// // //             const startAngles = sectorAngles.map((angle) => {
// // //                 const start = currentAngle;
// // //                 currentAngle += angle;
// // //                 return start;
// // //             });

// // //             Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
// // //                 const sectorIdx = parseInt(sectorIndex);
// // //                 const sectorAngle = sectorAngles[sectorIdx];

// // //                 if (!showEmptySectors && sectorAngle === 0) {
// // //                     return;
// // //                 }

// // //                 if (sectorAngle < 0.01) {
// // //                     return;
// // //                 }

// // //                 const startAngle = startAngles[sectorIdx];
// // //                 const centerAngle = startAngle + (sectorAngle / 2);

// // //                 sectorPoints.forEach(({ point, transformedPoint, index }, i) => {
// // //                     const clusterFactor = 0.9;
// // //                     const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * i) / Math.max(1, sectorPoints.length);

// // //                     const x = radius * Math.cos(centerAngle);
// // //                     const y = radius * Math.sin(centerAngle);

// // //                     positions.push({
// // //                         point,
// // //                         transformedPoint,
// // //                         x,
// // //                         y,
// // //                         sectorIndex: sectorIdx,
// // //                         angle: centerAngle
// // //                     });
// // //                 });
// // //             });
// // //         }

// // //         console.log(`Calculated ${positions.length} positions for ring ${ringIndex} using ${transformStrategy}`);
// // //         return positions;
// // //     } catch (error) {
// // //         console.error(`Error in calculatePointPositions for ring ${ringIndex}:`, error);
// // //         return [];
// // //     }
// // // };

// // // // Export all transformation functions for backward compatibility
// // // export {
// // //     transformPositiveNegative,
// // //     transformZScore,
// // //     transformPercentile,
// // //     transformCustomThreshold,
// // //     transformRadial,
// // //     transformDecisionTree
// // // };

// // import * as d3 from "d3";

// // import { transformPositiveNegative } from './options/PosNeg.js';
// // import { transformZScore } from './options/zScore.js';
// // import { transformPercentile } from './options/Percentile.js';
// // import { transformCustomThreshold } from './options/CustomThreshold.js';
// // import { transformRadial } from './options/Radial.js';
// // import { transformDecisionTree } from "./options/DecisionTree.js";

// // export const CoordinateTransforms = {
// //     POSITIVE_NEGATIVE: 'positive_negative',
// //     Z_SCORE: 'z_score',
// //     PERCENTILE: 'percentile',
// //     CUSTOM_THRESHOLD: 'custom_threshold',
// //     RADIAL: 'radial',
// //     DECISION_TREE: 'decision_tree'
// // };


// // export const transformCoordinates = (points, strategy, options = {}) => {
// //     try {
// //         switch (strategy) {
// //             case CoordinateTransforms.POSITIVE_NEGATIVE:
// //                 return transformPositiveNegative(points);
// //             case CoordinateTransforms.Z_SCORE:
// //                 return transformZScore(points, options.threshold || 0);
// //             case CoordinateTransforms.PERCENTILE:
// //                 return transformPercentile(points, options.percentile || 50);
// //             case CoordinateTransforms.CUSTOM_THRESHOLD:
// //                 return transformCustomThreshold(points, options.threshold || 0);
// //             case CoordinateTransforms.RADIAL:
// //                 return transformRadial(points, options);
// //             case CoordinateTransforms.DECISION_TREE:
// //                 return transformDecisionTree(points, options);
// //             default:
// //                 console.warn(`Unknown transformation strategy: ${strategy}, using positive_negative`);
// //                 return transformPositiveNegative(points);
// //         }
// //     } catch (error) {
// //         console.error(`Error in coordinate transformation (${strategy}):`, error);
// //         console.warn('Falling back to positive_negative transformation');
// //         return transformPositiveNegative(points);
// //     }
// // };

// // // Enhanced bit vector generation with decision tree support
// // export const generateBitVector = (point, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
// //     let coordinates;

// //     if (strategy === CoordinateTransforms.DECISION_TREE) {
// //         if (useTransformed && point.nodeAssignments) {
// //             // Use node path to create binary vector
// //             const binaryPath = point.nodeAssignments.map((assignment, index) => {
// //                 return (assignment.nodeId % 2).toString();
// //             }).join('');
// //             return binaryPath || '0';
// //         } else {
// //             coordinates = Object.entries(point).filter(([key, value]) =>
// //                 key !== "Point_ID" &&
// //                 key !== "nodeAssignments" &&
// //                 key !== "treePath" &&
// //                 key !== "predicted_class" &&
// //                 key !== "nodePath" &&
// //                 key !== "decisionPath" &&
// //                 key !== "finalSector" &&
// //                 typeof value === 'number' &&
// //                 !isNaN(value)
// //             );
// //         }
// //     } else {
// //         coordinates = Object.entries(point).filter(([key]) => {
// //             if (useTransformed) {
// //                 return key.endsWith('_binary');
// //             }
// //             return key !== "Point_ID" && !key.endsWith('_binary');
// //         });
// //     }

// //     if (!coordinates || coordinates.length === 0) {
// //         console.warn(`No coordinates found for point ${point.Point_ID} with strategy ${strategy}, useTransformed: ${useTransformed}`);
// //         coordinates = Object.entries(point).filter(([key, value]) =>
// //             key !== "Point_ID" &&
// //             typeof value === 'number' &&
// //             !isNaN(value)
// //         );
// //     }

// //     let bitVector;
// //     if (useTransformed && strategy === CoordinateTransforms.DECISION_TREE) {
// //         bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
// //     } else if (useTransformed) {
// //         bitVector = coordinates.map(([_, value]) => String(value)).join("");
// //     } else {
// //         bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
// //     }

// //     return bitVector || '0';
// // };

// // // Enhanced sector point counts calculation with decision tree support
// // export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {
// //     if (transformStrategy === CoordinateTransforms.RADIAL) {
// //         return pointsData.map(ringData => [ringData.points.length]);
// //     }


// //     if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// //         // For decision tree, calculate counts based on nodes at each depth
// //         return pointsData.map((ringData, ringIndex) => {
// //             try {
// //                 const sectors = ringData.sectors || ringData.nodes?.length || 1;
// //                 const counts = Array(sectors).fill(0);

// //                 (ringData.points || []).forEach(point => {
// //                     try {
// //                         if (point.nodeAssignments) {
// //                             const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// //                             if (assignment) {
// //                                 // Use sectorIndex instead of nodeId
// //                                 const sectorIndex = assignment.sectorIndex !== undefined ? assignment.sectorIndex : assignment.nodeId;

// //                                 if (sectorIndex >= 0 && sectorIndex < sectors) {
// //                                     counts[sectorIndex]++;
// //                                 } else {
// //                                     console.warn(`Invalid sectorIndex ${sectorIndex} for point ${point.Point_ID} at depth ${ringIndex} (max sectors: ${sectors})`);
// //                                 }
// //                             } else {
// //                                 console.warn(`No assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
// //                             }
// //                         } else {
// //                             console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// //                         }
// //                     } catch (error) {
// //                         console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// //                     }
// //                 });
// //                 console.log("calculate sector point function here")
// //                 console.log(`Ring ${ringIndex} (Decision Tree): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} nodes`);
// //                 return counts;
// //             } catch (error) {
// //                 console.error(`Error processing ring ${ringIndex} with decision tree:`, error);
// //                 return Array(ringData.sectors || 1).fill(0);
// //             }
// //         });
// //     }

// //     return pointsData.map((ringData, index) => {
// //         try {
// //             let pointsToCount = ringData.points;
// //             pointsToCount = transformCoordinates(ringData.points, transformStrategy, transformOptions);

// //             const sectors = ringData.sectors || 2 ** (index + 1);
// //             const counts = Array(sectors).fill(0);

// //             pointsToCount.forEach(point => {
// //                 try {
// //                     const sectorIndex = calculateSectorIndex(point, index, true, transformStrategy);
// //                     if (sectorIndex >= 0 && sectorIndex < sectors) {
// //                         counts[sectorIndex]++;
// //                     } else {
// //                         console.warn(`Invalid sector index ${sectorIndex} for point ${point.Point_ID} in ring ${index}`);
// //                     }
// //                 } catch (error) {
// //                     console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// //                 }
// //             });

// //             console.log(`Ring ${index} (${transformStrategy}): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} sectors`);
// //             return counts;
// //         } catch (error) {
// //             console.error(`Error processing ring ${index} with strategy ${transformStrategy}:`, error);
// //             const sectors = 2 ** (index + 1);
// //             return Array(sectors).fill(0);
// //         }
// //     });
// // };

// // // Enhanced sector index calculation with decision tree support
// // export const calculateSectorIndex = (point, ringIndex, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
// //     if (strategy === CoordinateTransforms.DECISION_TREE) {
// //         if (point.nodeAssignments) {
// //             const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// //             if (assignment) {
// //                 return assignment.nodeId;
// //             }
// //             console.warn(`No node assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
// //         } else {
// //             console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// //         }
// //         return 0;
// //     }

// //     const bitVector = generateBitVector(point, useTransformed, strategy);

// //     if (bitVector.length === 0) {
// //         console.warn(`Empty bit vector for point ${point.Point_ID}, returning sector 0`);
// //         return 0;
// //     }

// //     const sectors = 2 ** (ringIndex + 1);
// //     const binaryValue = parseInt(bitVector, 2) || 0;
// //     const sectorIndex = Math.min(binaryValue, sectors - 1);

// //     return sectorIndex;
// // };
// // // Helper function to get active sector mapping for point positioning
// // export const getActiveSectorMapping = (sectorCounts, showEmptySectors = true) => {
// //     const activeMaps = [];

// //     sectorCounts.forEach((counts, ringIndex) => {
// //         if (showEmptySectors) {
// //             activeMaps[ringIndex] = Array.from({ length: counts.length }, (_, i) => i);
// //         } else {
// //             activeMaps[ringIndex] = counts
// //                 .map((count, index) => count > 0 ? index : -1)
// //                 .filter(index => index !== -1);
// //         }
// //     });

// //     return activeMaps;
// // };

// // // Fixed proportional sector angles calculation that maintains hierarchical structure
// // export const calculateProportionalSectorAngles = (sectorCounts, showEmptySectors = true) => {
// //     const sectorAngles = [];
// //     const lastRingIndex = sectorCounts.length - 1;

// //     const activeSectorMaps = [];

// //     for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
// //         const currentCounts = sectorCounts[ringIndex];
// //         const sectors = currentCounts.length;

// //         if (sectors === 1) {
// //             sectorAngles[ringIndex] = [359 * Math.PI / 180];
// //             activeSectorMaps[ringIndex] = [0];
// //             continue;
// //         }

// //         const totalPoints = currentCounts.reduce((sum, count) => sum + count, 0) || 1;
// //         const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

// //         if (ringIndex === lastRingIndex) {
// //             if (showEmptySectors) {
// //                 const emptySectors = currentCounts.filter(count => count === 0).length;
// //                 const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

// //                 const angles = currentCounts.map(count => {
// //                     return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
// //                 });

// //                 sectorAngles[ringIndex] = angles;
// //                 activeSectorMaps[ringIndex] = Array.from({ length: sectors }, (_, i) => i);
// //             } else {
// //                 const activeSectors = [];
// //                 const activeAngles = [];

// //                 currentCounts.forEach((count, index) => {
// //                     if (count > 0) {
// //                         activeSectors.push(index);
// //                         activeAngles.push((count / totalPoints) * 2 * Math.PI);
// //                     }
// //                 });

// //                 const angles = Array(sectors).fill(0);
// //                 activeSectors.forEach((sectorIndex, i) => {
// //                     angles[sectorIndex] = activeAngles[i];
// //                 });

// //                 sectorAngles[ringIndex] = angles;
// //                 activeSectorMaps[ringIndex] = activeSectors;
// //             }
// //         } else {
// //             const outerAngles = sectorAngles[ringIndex + 1];
// //             const outerActiveSectors = activeSectorMaps[ringIndex + 1];
// //             const innerSectors = sectors;
// //             const outerSectors = outerAngles.length;

// //             if (outerSectors === 0 || outerActiveSectors.length === 0) {
// //                 const uniformAngle = 2 * Math.PI / innerSectors;
// //                 sectorAngles[ringIndex] = Array(innerSectors).fill(uniformAngle);
// //                 activeSectorMaps[ringIndex] = Array.from({ length: innerSectors }, (_, i) => i);
// //                 continue;
// //             }

// //             const ratio = outerSectors / innerSectors;
// //             const angles = Array(innerSectors).fill(0);
// //             const activeSectors = [];

// //             for (let i = 0; i < innerSectors; i++) {
// //                 let sumAngle = 0;
// //                 let hasActiveChild = false;

// //                 for (let j = 0; j < ratio && (i * ratio + j) < outerSectors; j++) {
// //                     const outerIdx = Math.floor(i * ratio + j);
// //                     const outerAngle = outerAngles[outerIdx] || 0;
// //                     sumAngle += outerAngle;

// //                     if (outerActiveSectors.includes(outerIdx) && outerAngle > 0) {
// //                         hasActiveChild = true;
// //                     }
// //                 }

// //                 if (showEmptySectors || hasActiveChild || currentCounts[i] > 0) {
// //                     angles[i] = sumAngle || (2 * Math.PI / innerSectors);
// //                     if (hasActiveChild || currentCounts[i] > 0) {
// //                         activeSectors.push(i);
// //                     }
// //                 } else {
// //                     angles[i] = 0;
// //                 }
// //             }

// //             sectorAngles[ringIndex] = angles;
// //             activeSectorMaps[ringIndex] = activeSectors;
// //         }
// //     }

// //     console.log('Proportional angles calculation:', {
// //         showEmptySectors,
// //         sectorAngles: sectorAngles.map((angles, i) => ({
// //             ring: i,
// //             angles: angles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
// //             activeSectors: activeSectorMaps[i],
// //             totalAngle: (angles.reduce((sum, a) => sum + a, 0) * 180 / Math.PI).toFixed(2) + '°'
// //         }))
// //     });

// //     return sectorAngles;
// // };

// // export const generateRingStructure = (jsonData, transformStrategy = null, transformOptions = {}, labelsData = null) => {
// //     if (!jsonData) {
// //         console.error("No jsonData provided to generateRingStructure.");
// //         return [];
// //     }
// //     if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// //         console.log("=== GENERATING DECISION TREE RING STRUCTURE ===");
// //         const allPoints = Object.values(jsonData).flat();
// //         console.log(`Processing ${allPoints.length} points for decision tree`);
// //         const result = transformDecisionTree(allPoints, { ...transformOptions, labelsData });
// //         const { tree, transformedPoints } = result;

// //         if (!tree || !tree.levels || tree.levels.length === 0) {
// //             console.warn("No valid tree levels generated.");
// //             return [];
// //         }

// //         const rings = [];

// //         // Root ring (depth 0, single node)
// //         const rootPoints = transformedPoints.filter(p =>
// //             p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === 0)
// //         );

// //         rings.push({
// //             key: `TreeRoot`,
// //             points: rootPoints,
// //             dimensions: 1,
// //             subspaceId: `TreeRoot`,
// //             ringIndex: 0,
// //             sectors: 1, // Root has only 1 sector (whole circle)
// //             structure: result.structure,
// //             nodes: tree.levels[0] || [] // Root node(s)
// //         });

// //         // Rings for depths 1 to max depth
// //         for (let depth = 1; depth < tree.levels.length; depth++) {
// //             const nodes = tree.levels[depth];
// //             const sectors = nodes.length; // Number of nodes at this depth = number of sectors
// //             console.log(`Depth ${depth}: ${sectors} nodes/sectors`);

// //             const pointsInRing = transformedPoints.filter(p => {
// //                 return p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === depth);
// //             }).map(p => ({
// //                 ...p,
// //                 sectorIndex: p.nodeAssignments.find(assignment => assignment.depth === depth)?.nodeId
// //             }));

// //             rings.push({
// //                 key: `TreeDepth${depth}`,
// //                 points: pointsInRing,
// //                 dimensions: depth + 1,
// //                 subspaceId: `TreeDepth${depth}`,
// //                 ringIndex: depth,
// //                 sectors, // Number of nodes at this depth
// //                 structure: result.structure,
// //                 nodes: nodes // Store the actual nodes for reference
// //             });
// //         }

// //         console.log(`Generated ${rings.length} rings with sectors: ${rings.map(r => r.sectors).join(', ')}`);
// //         console.log(`Points per ring: ${rings.map(r => r.points.length).join(', ')}`);
// //         return rings;
// //     }
// //     const subspaces = Object.keys(jsonData);
// //     subspaces.sort((a, b) => a.length - b.length);

// //     return subspaces.map((key, index) => ({
// //         key,
// //         points: jsonData[key] || [],
// //         dimensions: key.length,
// //         subspaceId: key,
// //         ringIndex: index,
// //         sectors: transformStrategy === CoordinateTransforms.RADIAL ? 1 : 2 ** (index + 1)
// //     }));
// // };

// // // Color scheme generation
// // export const generateColorSchemes = (ringCount) => {
// //     // 1. Keep ring color same for all the rings, and make it whitish yellowish.
// //     const fixedRingColor = "#f6e9a8"; // A light, slightly yellow/gold color

// //     // The getRingColor function now returns the fixed color regardless of the index.
// //     const getRingColor = (index) => fixedRingColor;

// //     // 2. The sector saturation should remain same as dark and light.
// //     // We use the fixed color as the base for sector calculation.
// //     const baseColorForSectors = d3.hsl(fixedRingColor);

// //     const getSectorColor = (ringIndex, sectorIndex) => {
// //         // baseColor remains the fixed yellow/gold, ensuring all rings use the same base hue/saturation
// //         const isPositive = sectorIndex % 2 === 0;

// //         // The logic for dark (0.35) and light (0.75) sectors is preserved.
// //         // We use the hue and saturation of the fixed color, but vary the lightness (l).
// //         return d3.hsl(baseColorForSectors.h, baseColorForSectors.s, isPositive ? 0.90 : 0.80).toString();
// //     };

// //     return { getRingColor, getSectorColor };
// // };

// // export const calculatePointPositions = (
// //     points,
// //     ringIndex,
// //     innerRadius,
// //     outerRadius,
// //     sectors,
// //     sectorAngles = null,
// //     viewMode = 'normal',
// //     showEmptySectors = true,
// //     transformStrategy = CoordinateTransforms.POSITIVE_NEGATIVE,
// //     transformOptions = {},
// //     ring = null
// // ) => {
// //     try {
// //         let transformedPoints = points;
// //         if (transformStrategy !== CoordinateTransforms.DECISION_TREE) {
// //             transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
// //         }

// //         const rotationOffset = 0;
// //         const positions = [];

// //         // --- Calculate Ring-Specific Max Magnitude (Constant Scale) ---
// //         // This value is used to normalize point magnitude (V_raw) across all sectors in this ring.
// //         let globalMaxMag = 1.0;
// //         const D = ringIndex + 1;

// //         transformedPoints.forEach(point => {
// //             const relevantCoords = Object.entries(point)
// //                 .filter(([key, value]) => key !== "Point_ID" && !key.endsWith('_binary') && typeof value === 'number')
// //                 .slice(0, D)
// //                 .map(([_, value]) => value);
// //             if (relevantCoords.length > 0) {
// //                 // Calculate magnitude (distance from the origin)
// //                 const magnitude = Math.sqrt(relevantCoords.reduce((sum, val) => sum + val * val, 0));
// //                 if (magnitude > globalMaxMag) {
// //                     globalMaxMag = magnitude;
// //                 }
// //             }
// //         });
// //         globalMaxMag = Math.max(1.0, globalMaxMag); // Ensure normalization denominator is at least 1.0
// //         // --- End Constant Scale Calculation ---

// //         if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
// //             if (ringIndex === 0) {
// //                 // ROOT RING (INNER CIRCLE) - Place all points in the center
// //                 console.log(`Root ring (depth 0): Positioning ${points.length} points in inner circle`);

// //                 const centerRadius = (innerRadius + outerRadius) / 2;
// //                 const numPoints = points.length;

// //                 if (numPoints === 1) {
// //                     // Single point at the center
// //                     positions.push({
// //                         point: points[0],
// //                         x: 0,
// //                         y: 0,
// //                         sectorIndex: 0,
// //                         angle: 0,
// //                         nodeId: 0
// //                     });
// //                 } else {
// //                     // Multiple points arranged in a circle
// //                     points.forEach((point, idx) => {
// //                         const angle = (2 * Math.PI * idx) / numPoints;
// //                         // Add some random variation to avoid exact overlap
// //                         const radiusVariation = (Math.random() - 0.5) * (outerRadius - innerRadius) * 0.3;
// //                         const radius = Math.max(innerRadius, Math.min(outerRadius, centerRadius + radiusVariation));

// //                         const x = radius * Math.cos(angle);
// //                         const y = radius * Math.sin(angle);

// //                         positions.push({
// //                             point,
// //                             x,
// //                             y,
// //                             sectorIndex: 0,
// //                             angle,
// //                             nodeId: 0
// //                         });
// //                     });
// //                 }

// //                 console.log(`Root ring: ${positions.length} points positioned in center circle`);
// //                 return positions;
// //             }

// //             // OUTER RINGS (depth > 0) - Place points in sectors based on tree structure
// //             const pointsByNode = {};
// //             transformedPoints.forEach((point, pointIndex) => {
// //                 if (!point.nodeAssignments) {
// //                     console.warn(`No nodeAssignments for point ${point.Point_ID}`);
// //                     return;
// //                 }

// //                 const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
// //                 if (!assignment) {
// //                     console.warn(`No assignment for point ${point.Point_ID} at depth ${ringIndex}`);
// //                     return;
// //                 }

// //                 const nodeId = assignment.nodeId;
// //                 if (!pointsByNode[nodeId]) {
// //                     pointsByNode[nodeId] = [];
// //                 }
// //                 pointsByNode[nodeId].push({ point, pointIndex, assignment });
// //             });

// //             // Process each node/sector
// //             Object.entries(pointsByNode).forEach(([nodeId, nodePoints]) => {
// //                 const assignment = nodePoints[0].assignment;
// //                 const sector = assignment.sector;

// //                 if (!sector) {
// //                     console.warn(`No sector info for node ${nodeId} at depth ${ringIndex}`);
// //                     return;
// //                 }

// //                 // Calculate the center angle of the sector
// //                 const sectorCenterAngle = (sector.startAngle + sector.endAngle) / 2;
// //                 const numPoints = nodePoints.length;

// //                 // Place points in the sector
// //                 nodePoints.forEach(({ point, pointIndex, assignment }, idx) => {

// //                     let radius;
// //                     let angle = sectorCenterAngle;

// //                     if (numPoints === 1) {
// //                         // Single point goes in the middle of the ring
// //                         radius = (innerRadius + outerRadius) / 2;
// //                     } else if (numPoints <= 3) {
// //                         // Few points: distribute radially
// //                         const radiusSpan = outerRadius - innerRadius;
// //                         const t = idx / Math.max(1, numPoints - 1);
// //                         radius = innerRadius + (t * radiusSpan);
// //                     } else {
// //                         // Many points: arrange in arc within the sector
// //                         const radiusSpan = outerRadius - innerRadius;
// //                         const radialLayers = Math.ceil(Math.sqrt(numPoints));
// //                         const pointsPerLayer = Math.ceil(numPoints / radialLayers);

// //                         const layerIndex = Math.floor(idx / pointsPerLayer);
// //                         const positionInLayer = idx % pointsPerLayer;

// //                         // Radius for this layer
// //                         radius = innerRadius + (layerIndex / Math.max(1, radialLayers - 1)) * radiusSpan;

// //                         // Angle variation within sector
// //                         const sectorWidth = sector.endAngle - sector.startAngle;
// //                         const maxAngleSpread = Math.min(sectorWidth * 0.8, Math.PI / 6); // Limit spread

// //                         if (pointsPerLayer > 1) {
// //                             const angleOffset = (positionInLayer / (pointsPerLayer - 1) - 0.5) * maxAngleSpread;
// //                             angle = sectorCenterAngle + angleOffset;
// //                         }
// //                     }

// //                     // Convert polar coordinates to Cartesian
// //                     const x = radius * Math.cos(angle);
// //                     const y = radius * Math.sin(angle);

// //                     if (isNaN(x) || isNaN(y)) {
// //                         console.warn(`Invalid position for point ${point.Point_ID} at node ${nodeId}`);
// //                         return;
// //                     }

// //                     positions.push({
// //                         point,
// //                         x,
// //                         y,
// //                         sectorIndex: parseInt(nodeId),
// //                         angle,
// //                         nodeId: parseInt(nodeId)
// //                     });
// //                 });
// //             });

// //             console.log(`Ring ${ringIndex}: ${positions.length} points positioned across ${sectors} sectors`);

// //         } else if (transformStrategy === CoordinateTransforms.RADIAL) {
// //             // [Unchanged RADIAL case]
// //             const effectiveInnerRadius = ringIndex === 0 ? 20 : innerRadius;
// //             const effectiveOuterRadius = ringIndex === 0 ? 60 : outerRadius;
// //             const centralRadius = (effectiveInnerRadius + effectiveOuterRadius) / 2;

// //             const angleGroups = {};
// //             transformedPoints.forEach((point, pointIndex) => {
// //                 const angle = point.angle !== undefined ? point.angle + rotationOffset : rotationOffset;
// //                 const angleKey = angle.toFixed(8);
// //                 if (!angleGroups[angleKey]) {
// //                     angleGroups[angleKey] = [];
// //                 }
// //                 angleGroups[angleKey].push({ point, pointIndex, angle });
// //             });

// //             Object.values(angleGroups).forEach(group => {
// //                 const numCoinciding = group.length;
// //                 group.forEach(({ point, pointIndex, angle }, index) => {
// //                     const originalPoint = points[pointIndex];

// //                     let radius = centralRadius;
// //                     if (numCoinciding > 1) {
// //                         const offsetStep = 3;
// //                         const offset = ((index - (numCoinciding - 1) / 2) * offsetStep);
// //                         radius += offset;
// //                     }

// //                     radius = Math.max(effectiveInnerRadius, Math.min(effectiveOuterRadius, radius));

// //                     const x = radius * Math.cos(angle);
// //                     const y = radius * Math.sin(angle);

// //                     if (isNaN(x) || isNaN(y)) {
// //                         console.warn(`Invalid position for point ${point.Point_ID}`);
// //                         return;
// //                     }

// //                     positions.push({
// //                         point: originalPoint,
// //                         transformedPoint: point,
// //                         x,
// //                         y,
// //                         sectorIndex: 0,
// //                         angle
// //                     });
// //                 });
// //             });
// //         } else if (viewMode === 'normal') {
// //             // [MODIFIED normal view mode case for horizontal/angular spread]
// //             const sectorCounts = Array(sectors).fill(0);
// //             const pointsBySector = {};

// //             // 1. Group points by sector and calculate point magnitude 

// //             transformedPoints.forEach((point, pointIndex) => {
// //                 try {
// //                     const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
// //                     if (sectorIndex >= 0 && sectorIndex < sectors) {
// //                         sectorCounts[sectorIndex]++;
// //                         if (!pointsBySector[sectorIndex]) {
// //                             pointsBySector[sectorIndex] = [];
// //                         }

// //                         // Calculate magnitude for this point based on its relevant coordinates
// //                         const relevantCoords = Object.entries(point)
// //                             .filter(([key, value]) =>
// //                                 key !== "Point_ID" &&
// //                                 !key.endsWith('_binary') &&
// //                                 typeof value === 'number'
// //                             )
// //                             .slice(0, D)
// //                             .map(([_, value]) => value);

// //                         let magnitude = 0;
// //                         if (relevantCoords.length > 0) {
// //                             magnitude = Math.sqrt(relevantCoords.reduce((sum, val) => sum + val * val, 0));
// //                         }

// //                         pointsBySector[sectorIndex].push({
// //                             point: points[pointIndex],
// //                             transformedPoint: point,
// //                             magnitude: magnitude, // Store magnitude for later use
// //                             pointIndex
// //                         });
// //                     }
// //                 } catch (error) {
// //                     console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
// //                 }
// //             });

// //             const sectorsToRender = showEmptySectors ?
// //                 Array.from({ length: sectors }, (_, i) => i) :
// //                 Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

// //             const anglePerSector = 2 * Math.PI / (showEmptySectors ? sectors : sectorsToRender.length);

// //             Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
// //                 const sectorIdx = parseInt(sectorIndex);

// //                 let displayIndex = sectorIdx;
// //                 if (!showEmptySectors) {
// //                     displayIndex = sectorsToRender.indexOf(sectorIdx);
// //                     if (displayIndex === -1) return;
// //                 }

// //                 const startAngle = (anglePerSector * displayIndex) + rotationOffset;
// //                 const endAngle = startAngle + anglePerSector;

// //                 // Proxy for sector sign based on MSB:
// //                 const isPositiveSector = sectorIdx >= (2 ** (D - 1));
// //                 const radiusSpan = outerRadius - innerRadius;

// //                 sectorPoints.forEach(({ point, transformedPoint, magnitude }, i) => {
// //                     // --- STEP A & B: CALCULATE NORMALIZED VALUE (V_normalized) ---
// //                     // V_raw: Normalized magnitude [0, 1] using RING MAX (globalMaxMag)
// //                     const V_raw = magnitude / globalMaxMag;

// //                     let V_normalized;
// //                     if (isPositiveSector) {
// //                         // Positive Sector: maps 0 (min magnitude) to 1 (max magnitude)
// //                         V_normalized = V_raw;
// //                     } else {
// //                         // Negative Sector: maps -1 (max magnitude) to 0 (min magnitude)
// //                         V_normalized = 1.0 - V_raw;
// //                     }


// //                     // --- STEP C: CALCULATE ANGLE AND RADIUS ---

// //                     // Angular position: Map V_normalized [0, 1] to the angular range [startAngle, endAngle]
// //                     const angleSpreadFactor = 0.8; // Use 80% of the angle for spreading
// //                     const angleMargin = anglePerSector * (1 - angleSpreadFactor) / 2;
// //                     const angleSpan = anglePerSector * angleSpreadFactor;

// //                     // The point's value is mapped to its horizontal position within the sector
// //                     const angle = startAngle + angleMargin + (V_normalized * angleSpan);


// //                     // Radial position: Use index (i) for vertical spread and slight jitter to prevent overlap.
// //                     const verticalSpreadFactor = i / Math.max(1, sectorPoints.length); // 0 to 1 based on index
// //                     const radialJitter = (Math.random() - 0.5) * radiusSpan * 0.1; // Small random jitter

// //                     // Spread radially based on index to avoid total overlap
// //                     const radius = innerRadius + radiusSpan * (0.1 + verticalSpreadFactor * 0.8) + radialJitter;


// //                     const x = radius * Math.cos(angle);
// //                     const y = radius * Math.sin(angle);

// //                     positions.push({
// //                         point,
// //                         transformedPoint,
// //                         x,
// //                         y,
// //                         sectorIndex: sectorIdx,
// //                         angle: angle
// //                     });
// //                 });
// //             });
// //         } else if (viewMode === 'proportional' && sectorAngles) {
// //             // [MODIFIED proportional view mode case for horizontal/angular spread]
// //             const pointsBySector = {};

// //             // 1. Group points by sector and calculate point magnitude 

// //             transformedPoints.forEach((point, index) => {
// //                 try {
// //                     const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
// //                     if (!pointsBySector[sectorIndex]) {
// //                         pointsBySector[sectorIndex] = [];
// //                     }

// //                     // Calculate magnitude for this point based on its relevant coordinates
// //                     const relevantCoords = Object.entries(point)
// //                         .filter(([key, value]) =>
// //                             key !== "Point_ID" &&
// //                             !key.endsWith('_binary') &&
// //                             typeof value === 'number'
// //                         )
// //                         .slice(0, D)
// //                         .map(([_, value]) => value);

// //                     let magnitude = 0;
// //                     if (relevantCoords.length > 0) {
// //                         magnitude = Math.sqrt(relevantCoords.reduce((sum, val) => sum + val * val, 0));
// //                     }

// //                     pointsBySector[sectorIndex].push({
// //                         point: points[index],
// //                         transformedPoint: point,
// //                         magnitude: magnitude, // Store magnitude for later use
// //                         index
// //                     });
// //                 } catch (error) {
// //                     console.error(`Error grouping point ${point.Point_ID} by sector:`, error);
// //                 }
// //             });

// //             let currentAngle = rotationOffset;
// //             const startAngles = sectorAngles.map((angle) => {
// //                 const start = currentAngle;
// //                 currentAngle += angle;
// //                 return start;
// //             });

// //             Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
// //                 const sectorIdx = parseInt(sectorIndex);
// //                 const sectorAngle = sectorAngles[sectorIdx];

// //                 if (!showEmptySectors && sectorAngle === 0) {
// //                     return;
// //                 }

// //                 if (sectorAngle < 0.01) {
// //                     return;
// //                 }

// //                 const startAngle = startAngles[sectorIdx];

// //                 // Proxy for sector sign based on MSB:
// //                 const isPositiveSector = sectorIdx >= (2 ** (D - 1));
// //                 const radiusSpan = outerRadius - innerRadius;

// //                 sectorPoints.forEach(({ point, transformedPoint, magnitude, index }, i) => {
// //                     // --- STEP A & B: CALCULATE NORMALIZED VALUE (V_normalized) ---
// //                     // V_raw: Normalized magnitude [0, 1] using RING MAX (globalMaxMag)
// //                     const V_raw = magnitude / globalMaxMag;

// //                     let V_normalized;
// //                     if (isPositiveSector) {
// //                         // Positive Sector: maps 0 (min magnitude) to 1 (max magnitude)
// //                         V_normalized = V_raw;
// //                     } else {
// //                         // Negative Sector: maps -1 (max magnitude) to 0 (min magnitude)
// //                         V_normalized = 1.0 - V_raw;
// //                     }


// //                     // --- STEP C: CALCULATE ANGLE AND RADIUS ---

// //                     // Angular position: Map V_normalized [0, 1] to the angular range [startAngle, endAngle]
// //                     const angleSpreadFactor = 0.8;
// //                     const angleMargin = sectorAngle * (1 - angleSpreadFactor) / 2;
// //                     const angleSpan = sectorAngle * angleSpreadFactor;

// //                     // The point's value is mapped to its horizontal position within the sector
// //                     const angle = startAngle + angleMargin + (V_normalized * angleSpan);


// //                     // Radial position: Use index (i) for vertical spread and slight jitter to prevent overlap.
// //                     const verticalSpreadFactor = i / Math.max(1, sectorPoints.length); // 0 to 1 based on index
// //                     const radialJitter = (Math.random() - 0.5) * radiusSpan * 0.1; // Small random jitter

// //                     // Spread radially based on index to avoid total overlap
// //                     const radius = innerRadius + radiusSpan * (0.1 + verticalSpreadFactor * 0.8) + radialJitter;

// //                     const x = radius * Math.cos(angle);
// //                     const y = radius * Math.sin(angle);

// //                     positions.push({
// //                         point,
// //                         transformedPoint,
// //                         x,
// //                         y,
// //                         sectorIndex: sectorIdx,
// //                         angle: angle
// //                     });
// //                 });
// //             });
// //         }

// //         console.log(`Calculated ${positions.length} positions for ring ${ringIndex} using ${transformStrategy}`);
// //         return positions;
// //     } catch (error) {
// //         console.error(`Error in calculatePointPositions for ring ${ringIndex}:`, error);
// //         return [];
// //     }
// // };

// // // Export all transformation functions for backward compatibility
// // export {
// //     transformPositiveNegative,
// //     transformZScore,
// //     transformPercentile,
// //     transformCustomThreshold,
// //     transformRadial,
// //     transformDecisionTree
// // };

// import * as d3 from "d3";

// import { transformPositiveNegative } from './options/PosNeg.js';
// import { transformZScore } from './options/zScore.js';
// import { transformPercentile } from './options/Percentile.js';
// import { transformCustomThreshold } from './options/CustomThreshold.js';
// import { transformRadial } from './options/Radial.js';
// import { transformDecisionTree } from "./options/DecisionTree.js";

// export const CoordinateTransforms = {
//     POSITIVE_NEGATIVE: 'positive_negative',
//     Z_SCORE: 'z_score',
//     PERCENTILE: 'percentile',
//     CUSTOM_THRESHOLD: 'custom_threshold',
//     RADIAL: 'radial',
//     DECISION_TREE: 'decision_tree'
// };


// export const transformCoordinates = (points, strategy, options = {}) => {
//     try {
//         switch (strategy) {
//             case CoordinateTransforms.POSITIVE_NEGATIVE:
//                 return transformPositiveNegative(points);
//             case CoordinateTransforms.Z_SCORE:
//                 return transformZScore(points, options.threshold || 0);
//             case CoordinateTransforms.PERCENTILE:
//                 return transformPercentile(points, options.percentile || 50);
//             case CoordinateTransforms.CUSTOM_THRESHOLD:
//                 return transformCustomThreshold(points, options.threshold || 0);
//             case CoordinateTransforms.RADIAL:
//                 return transformRadial(points, options);
//             case CoordinateTransforms.DECISION_TREE:
//                 return transformDecisionTree(points, options);
//             default:
//                 console.warn(`Unknown transformation strategy: ${strategy}, using positive_negative`);
//                 return transformPositiveNegative(points);
//         }
//     } catch (error) {
//         console.error(`Error in coordinate transformation (${strategy}):`, error);
//         console.warn('Falling back to positive_negative transformation');
//         return transformPositiveNegative(points);
//     }
// };

// // Enhanced bit vector generation with decision tree support
// export const generateBitVector = (point, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
//     let coordinates;

//     if (strategy === CoordinateTransforms.DECISION_TREE) {
//         if (useTransformed && point.nodeAssignments) {
//             // Use node path to create binary vector
//             const binaryPath = point.nodeAssignments.map((assignment, index) => {
//                 return (assignment.nodeId % 2).toString();
//             }).join('');
//             return binaryPath || '0';
//         } else {
//             coordinates = Object.entries(point).filter(([key, value]) =>
//                 key !== "Point_ID" &&
//                 key !== "nodeAssignments" &&
//                 key !== "treePath" &&
//                 key !== "predicted_class" &&
//                 key !== "nodePath" &&
//                 key !== "decisionPath" &&
//                 key !== "finalSector" &&
//                 typeof value === 'number' &&
//                 !isNaN(value)
//             );
//         }
//     } else {
//         coordinates = Object.entries(point).filter(([key]) => {
//             if (useTransformed) {
//                 return key.endsWith('_binary');
//             }
//             return key !== "Point_ID" && !key.endsWith('_binary');
//         });
//     }

//     if (!coordinates || coordinates.length === 0) {
//         console.warn(`No coordinates found for point ${point.Point_ID} with strategy ${strategy}, useTransformed: ${useTransformed}`);
//         coordinates = Object.entries(point).filter(([key, value]) =>
//             key !== "Point_ID" &&
//             typeof value === 'number' &&
//             !isNaN(value)
//         );
//     }

//     let bitVector;
//     if (useTransformed && strategy === CoordinateTransforms.DECISION_TREE) {
//         bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
//     } else if (useTransformed) {
//         bitVector = coordinates.map(([_, value]) => String(value)).join("");
//     } else {
//         bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
//     }

//     return bitVector || '0';
// };

// // Enhanced sector point counts calculation with decision tree support
// export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {
//     if (transformStrategy === CoordinateTransforms.RADIAL) {
//         return pointsData.map(ringData => [ringData.points.length]);
//     }


//     if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
//         // For decision tree, calculate counts based on nodes at each depth
//         return pointsData.map((ringData, ringIndex) => {
//             try {
//                 const sectors = ringData.sectors || ringData.nodes?.length || 1;
//                 const counts = Array(sectors).fill(0);

//                 (ringData.points || []).forEach(point => {
//                     try {
//                         if (point.nodeAssignments) {
//                             const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
//                             if (assignment) {
//                                 // Use sectorIndex instead of nodeId
//                                 const sectorIndex = assignment.sectorIndex !== undefined ? assignment.sectorIndex : assignment.nodeId;

//                                 if (sectorIndex >= 0 && sectorIndex < sectors) {
//                                     counts[sectorIndex]++;
//                                 } else {
//                                     console.warn(`Invalid sectorIndex ${sectorIndex} for point ${point.Point_ID} at depth ${ringIndex} (max sectors: ${sectors})`);
//                                 }
//                             } else {
//                                 console.warn(`No assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
//                             }
//                         } else {
//                             console.warn(`No nodeAssignments for point ${point.Point_ID}`);
//                         }
//                     } catch (error) {
//                         console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
//                     }
//                 });
//                 console.log("calculate sector point function here")
//                 console.log(`Ring ${ringIndex} (Decision Tree): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} nodes`);
//                 return counts;
//             } catch (error) {
//                 console.error(`Error processing ring ${ringIndex} with decision tree:`, error);
//                 return Array(ringData.sectors || 1).fill(0);
//             }
//         });
//     }

//     return pointsData.map((ringData, index) => {
//         try {
//             let pointsToCount = ringData.points;
//             pointsToCount = transformCoordinates(ringData.points, transformStrategy, transformOptions);

//             const sectors = ringData.sectors || 2 ** (index + 1);
//             const counts = Array(sectors).fill(0);

//             pointsToCount.forEach(point => {
//                 try {
//                     const sectorIndex = calculateSectorIndex(point, index, true, transformStrategy);
//                     if (sectorIndex >= 0 && sectorIndex < sectors) {
//                         counts[sectorIndex]++;
//                     } else {
//                         console.warn(`Invalid sector index ${sectorIndex} for point ${point.Point_ID} in ring ${index}`);
//                     }
//                 } catch (error) {
//                     console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
//                 }
//             });

//             console.log(`Ring ${index} (${transformStrategy}): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} sectors`);
//             return counts;
//         } catch (error) {
//             console.error(`Error processing ring ${index} with strategy ${transformStrategy}:`, error);
//             const sectors = 2 ** (index + 1);
//             return Array(sectors).fill(0);
//         }
//     });
// };

// // Enhanced sector index calculation with decision tree support
// export const calculateSectorIndex = (point, ringIndex, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
//     if (strategy === CoordinateTransforms.DECISION_TREE) {
//         if (point.nodeAssignments) {
//             const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
//             if (assignment) {
//                 return assignment.nodeId;
//             }
//             console.warn(`No node assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
//         } else {
//             console.warn(`No nodeAssignments for point ${point.Point_ID}`);
//         }
//         return 0;
//     }

//     const bitVector = generateBitVector(point, useTransformed, strategy);

//     if (bitVector.length === 0) {
//         console.warn(`Empty bit vector for point ${point.Point_ID}, returning sector 0`);
//         return 0;
//     }

//     const sectors = 2 ** (ringIndex + 1);
//     const binaryValue = parseInt(bitVector, 2) || 0;
//     const sectorIndex = Math.min(binaryValue, sectors - 1);

//     return sectorIndex;
// };
// // Helper function to get active sector mapping for point positioning
// export const getActiveSectorMapping = (sectorCounts, showEmptySectors = true) => {
//     const activeMaps = [];

//     sectorCounts.forEach((counts, ringIndex) => {
//         if (showEmptySectors) {
//             activeMaps[ringIndex] = Array.from({ length: counts.length }, (_, i) => i);
//         } else {
//             activeMaps[ringIndex] = counts
//                 .map((count, index) => count > 0 ? index : -1)
//                 .filter(index => index !== -1);
//         }
//     });

//     return activeMaps;
// };

// // Fixed proportional sector angles calculation that maintains hierarchical structure
// export const calculateProportionalSectorAngles = (sectorCounts, showEmptySectors = true) => {
//     const sectorAngles = [];
//     const lastRingIndex = sectorCounts.length - 1;

//     const activeSectorMaps = [];

//     for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
//         const currentCounts = sectorCounts[ringIndex];
//         const sectors = currentCounts.length;

//         if (sectors === 1) {
//             sectorAngles[ringIndex] = [359 * Math.PI / 180];
//             activeSectorMaps[ringIndex] = [0];
//             continue;
//         }

//         const totalPoints = currentCounts.reduce((sum, count) => sum + count, 0) || 1;
//         const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

//         if (ringIndex === lastRingIndex) {
//             if (showEmptySectors) {
//                 const emptySectors = currentCounts.filter(count => count === 0).length;
//                 const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

//                 const angles = currentCounts.map(count => {
//                     return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
//                 });

//                 sectorAngles[ringIndex] = angles;
//                 activeSectorMaps[ringIndex] = Array.from({ length: sectors }, (_, i) => i);
//             } else {
//                 const activeSectors = [];
//                 const activeAngles = [];

//                 currentCounts.forEach((count, index) => {
//                     if (count > 0) {
//                         activeSectors.push(index);
//                         activeAngles.push((count / totalPoints) * 2 * Math.PI);
//                     }
//                 });

//                 const angles = Array(sectors).fill(0);
//                 activeSectors.forEach((sectorIndex, i) => {
//                     angles[sectorIndex] = activeAngles[i];
//                 });

//                 sectorAngles[ringIndex] = angles;
//                 activeSectorMaps[ringIndex] = activeSectors;
//             }
//         } else {
//             const outerAngles = sectorAngles[ringIndex + 1];
//             const outerActiveSectors = activeSectorMaps[ringIndex + 1];
//             const innerSectors = sectors;
//             const outerSectors = outerAngles.length;

//             if (outerSectors === 0 || outerActiveSectors.length === 0) {
//                 const uniformAngle = 2 * Math.PI / innerSectors;
//                 sectorAngles[ringIndex] = Array(innerSectors).fill(uniformAngle);
//                 activeSectorMaps[ringIndex] = Array.from({ length: innerSectors }, (_, i) => i);
//                 continue;
//             }

//             const ratio = outerSectors / innerSectors;
//             const angles = Array(innerSectors).fill(0);
//             const activeSectors = [];

//             for (let i = 0; i < innerSectors; i++) {
//                 let sumAngle = 0;
//                 let hasActiveChild = false;

//                 for (let j = 0; j < ratio && (i * ratio + j) < outerSectors; j++) {
//                     const outerIdx = Math.floor(i * ratio + j);
//                     const outerAngle = outerAngles[outerIdx] || 0;
//                     sumAngle += outerAngle;

//                     if (outerActiveSectors.includes(outerIdx) && outerAngle > 0) {
//                         hasActiveChild = true;
//                     }
//                 }

//                 if (showEmptySectors || hasActiveChild || currentCounts[i] > 0) {
//                     angles[i] = sumAngle || (2 * Math.PI / innerSectors);
//                     if (hasActiveChild || currentCounts[i] > 0) {
//                         activeSectors.push(i);
//                     }
//                 } else {
//                     angles[i] = 0;
//                 }
//             }

//             sectorAngles[ringIndex] = angles;
//             activeSectorMaps[ringIndex] = activeSectors;
//         }
//     }

//     console.log('Proportional angles calculation:', {
//         showEmptySectors,
//         sectorAngles: sectorAngles.map((angles, i) => ({
//             ring: i,
//             angles: angles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
//             activeSectors: activeSectorMaps[i],
//             totalAngle: (angles.reduce((sum, a) => sum + a, 0) * 180 / Math.PI).toFixed(2) + '°'
//         }))
//     });

//     return sectorAngles;
// };

// export const generateRingStructure = (jsonData, transformStrategy = null, transformOptions = {}, labelsData = null) => {
//     if (!jsonData) {
//         console.error("No jsonData provided to generateRingStructure.");
//         return [];
//     }
//     if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
//         console.log("=== GENERATING DECISION TREE RING STRUCTURE ===");
//         const allPoints = Object.values(jsonData).flat();
//         console.log(`Processing ${allPoints.length} points for decision tree`);
//         const result = transformDecisionTree(allPoints, { ...transformOptions, labelsData });
//         const { tree, transformedPoints } = result;

//         if (!tree || !tree.levels || tree.levels.length === 0) {
//             console.warn("No valid tree levels generated.");
//             return [];
//         }

//         const rings = [];

//         // Root ring (depth 0, single node)
//         const rootPoints = transformedPoints.filter(p =>
//             p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === 0)
//         );

//         rings.push({
//             key: `TreeRoot`,
//             points: rootPoints,
//             dimensions: 1,
//             subspaceId: `TreeRoot`,
//             ringIndex: 0,
//             sectors: 1, // Root has only 1 sector (whole circle)
//             structure: result.structure,
//             nodes: tree.levels[0] || [] // Root node(s)
//         });

//         // Rings for depths 1 to max depth
//         for (let depth = 1; depth < tree.levels.length; depth++) {
//             const nodes = tree.levels[depth];
//             const sectors = nodes.length; // Number of nodes at this depth = number of sectors
//             console.log(`Depth ${depth}: ${sectors} nodes/sectors`);

//             const pointsInRing = transformedPoints.filter(p => {
//                 return p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === depth);
//             }).map(p => ({
//                 ...p,
//                 sectorIndex: p.nodeAssignments.find(assignment => assignment.depth === depth)?.nodeId
//             }));

//             rings.push({
//                 key: `TreeDepth${depth}`,
//                 points: pointsInRing,
//                 dimensions: depth + 1,
//                 subspaceId: `TreeDepth${depth}`,
//                 ringIndex: depth,
//                 sectors, // Number of nodes at this depth
//                 structure: result.structure,
//                 nodes: nodes // Store the actual nodes for reference
//             });
//         }

//         console.log(`Generated ${rings.length} rings with sectors: ${rings.map(r => r.sectors).join(', ')}`);
//         console.log(`Points per ring: ${rings.map(r => r.points.length).join(', ')}`);
//         return rings;
//     }
//     const subspaces = Object.keys(jsonData);
//     subspaces.sort((a, b) => a.length - b.length);

//     return subspaces.map((key, index) => ({
//         key,
//         points: jsonData[key] || [],
//         dimensions: key.length,
//         subspaceId: key,
//         ringIndex: index,
//         sectors: transformStrategy === CoordinateTransforms.RADIAL ? 1 : 2 ** (index + 1)
//     }));
// };

// // Color scheme generation
// export const generateColorSchemes = (ringCount) => {
//     // 1. Keep ring color same for all the rings, and make it whitish yellowish.
//     const fixedRingColor = "#f6e9a8"; // A light, slightly yellow/gold color

//     // The getRingColor function now returns the fixed color regardless of the index.
//     const getRingColor = (index) => fixedRingColor;

//     // 2. The sector saturation should remain same as dark and light.
//     // We use the fixed color as the base for sector calculation.
//     const baseColorForSectors = d3.hsl(fixedRingColor);

//     const getSectorColor = (ringIndex, sectorIndex) => {
//         // baseColor remains the fixed yellow/gold, ensuring all rings use the same base hue/saturation
//         const isPositive = sectorIndex % 2 === 0;

//         // The logic for dark (0.35) and light (0.75) sectors is preserved.
//         // We use the hue and saturation of the fixed color, but vary the lightness (l).
//         return d3.hsl(baseColorForSectors.h, baseColorForSectors.s, isPositive ? 0.90 : 0.80).toString();
//     };

//     return { getRingColor, getSectorColor };
// };

// export const calculatePointPositions = (
//     points,
//     ringIndex,
//     innerRadius,
//     outerRadius,
//     sectors,
//     sectorAngles = null,
//     viewMode = 'normal',
//     showEmptySectors = true,
//     transformStrategy = CoordinateTransforms.POSITIVE_NEGATIVE,
//     transformOptions = {},
//     ring = null
// ) => {
//     try {
//         let transformedPoints = points;
//         if (transformStrategy !== CoordinateTransforms.DECISION_TREE) {
//             transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
//         }

//         const rotationOffset = 0;
//         const positions = [];

//         // --- Calculate Ring-Specific Max Magnitude (Constant Scale) ---
//         let globalMaxMag = 1.0;
//         const D = ringIndex + 1;

//         transformedPoints.forEach(point => {
//             const relevantCoords = Object.entries(point)
//                 .filter(([key, value]) => key !== "Point_ID" && !key.endsWith('_binary') && typeof value === 'number')
//                 .slice(0, D)
//                 .map(([_, value]) => value);
//             if (relevantCoords.length > 0) {
//                 const magnitude = Math.sqrt(relevantCoords.reduce((sum, val) => sum + val * val, 0));
//                 if (magnitude > globalMaxMag) {
//                     globalMaxMag = magnitude;
//                 }
//             }
//         });
//         globalMaxMag = Math.max(1.0, globalMaxMag);
//         // --- End Constant Scale Calculation ---

//         // Calculate the fixed radius for the arc plot mode
//         const fixedMidRadius = innerRadius + ((outerRadius - innerRadius) / 2);


//         if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
//             if (ringIndex === 0) {
//                 // ROOT RING (INNER CIRCLE) - Place all points in the center
//                 console.log(`Root ring (depth 0): Positioning ${points.length} points in inner circle`);

//                 const centerRadius = (innerRadius + outerRadius) / 2;
//                 const numPoints = points.length;

//                 if (numPoints === 1) {
//                     // Single point at the center
//                     positions.push({
//                         point: points[0],
//                         x: 0,
//                         y: 0,
//                         sectorIndex: 0,
//                         angle: 0,
//                         nodeId: 0
//                     });
//                 } else {
//                     // Multiple points arranged in a circle
//                     points.forEach((point, idx) => {
//                         const angle = (2 * Math.PI * idx) / numPoints;
//                         // Add some random variation to avoid exact overlap
//                         const radiusVariation = (Math.random() - 0.5) * (outerRadius - innerRadius) * 0.3;
//                         const radius = Math.max(innerRadius, Math.min(outerRadius, centerRadius + radiusVariation));

//                         const x = radius * Math.cos(angle);
//                         const y = radius * Math.sin(angle);

//                         positions.push({
//                             point,
//                             x,
//                             y,
//                             sectorIndex: 0,
//                             angle,
//                             nodeId: 0
//                         });
//                     });
//                 }

//                 console.log(`Root ring: ${positions.length} points positioned in center circle`);
//                 return positions;
//             }

//             // OUTER RINGS (depth > 0) - Place points in sectors based on tree structure
//             const pointsByNode = {};
//             transformedPoints.forEach((point, pointIndex) => {
//                 if (!point.nodeAssignments) {
//                     console.warn(`No nodeAssignments for point ${point.Point_ID}`);
//                     return;
//                 }

//                 const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
//                 if (!assignment) {
//                     console.warn(`No assignment for point ${point.Point_ID} at depth ${ringIndex}`);
//                     return;
//                 }

//                 const nodeId = assignment.nodeId;
//                 if (!pointsByNode[nodeId]) {
//                     pointsByNode[nodeId] = [];
//                 }
//                 pointsByNode[nodeId].push({ point, pointIndex, assignment });
//             });

//             // Process each node/sector
//             Object.entries(pointsByNode).forEach(([nodeId, nodePoints]) => {
//                 const assignment = nodePoints[0].assignment;
//                 const sector = assignment.sector;

//                 if (!sector) {
//                     console.warn(`No sector info for node ${nodeId} at depth ${ringIndex}`);
//                     return;
//                 }

//                 // Calculate the center angle of the sector
//                 const sectorCenterAngle = (sector.startAngle + sector.endAngle) / 2;
//                 const numPoints = nodePoints.length;

//                 // Place points in the sector
//                 nodePoints.forEach(({ point, pointIndex, assignment }, idx) => {

//                     let radius;
//                     let angle = sectorCenterAngle;

//                     if (numPoints === 1) {
//                         // Single point goes in the middle of the ring
//                         radius = (innerRadius + outerRadius) / 2;
//                     } else if (numPoints <= 3) {
//                         // Few points: distribute radially
//                         const radiusSpan = outerRadius - innerRadius;
//                         const t = idx / Math.max(1, numPoints - 1);
//                         radius = innerRadius + (t * radiusSpan);
//                     } else {
//                         // Many points: arrange in arc within the sector
//                         const radiusSpan = outerRadius - innerRadius;
//                         const radialLayers = Math.ceil(Math.sqrt(numPoints));
//                         const pointsPerLayer = Math.ceil(numPoints / radialLayers);

//                         const layerIndex = Math.floor(idx / pointsPerLayer);
//                         const positionInLayer = idx % pointsPerLayer;

//                         // Radius for this layer
//                         radius = innerRadius + (layerIndex / Math.max(1, radialLayers - 1)) * radiusSpan;

//                         // Angle variation within sector
//                         const sectorWidth = sector.endAngle - sector.startAngle;
//                         const maxAngleSpread = Math.min(sectorWidth * 0.8, Math.PI / 6); // Limit spread

//                         if (pointsPerLayer > 1) {
//                             const angleOffset = (positionInLayer / (pointsPerLayer - 1) - 0.5) * maxAngleSpread;
//                             angle = sectorCenterAngle + angleOffset;
//                         }
//                     }

//                     // Convert polar coordinates to Cartesian
//                     const x = radius * Math.cos(angle);
//                     const y = radius * Math.sin(angle);

//                     if (isNaN(x) || isNaN(y)) {
//                         console.warn(`Invalid position for point ${point.Point_ID} at node ${nodeId}`);
//                         return;
//                     }

//                     positions.push({
//                         point,
//                         x,
//                         y,
//                         sectorIndex: parseInt(nodeId),
//                         angle,
//                         nodeId: parseInt(nodeId)
//                     });
//                 });
//             });

//             console.log(`Ring ${ringIndex}: ${positions.length} points positioned across ${sectors} sectors`);

//         } else if (transformStrategy === CoordinateTransforms.RADIAL) {
//             // [Unchanged RADIAL case]
//             const effectiveInnerRadius = ringIndex === 0 ? 20 : innerRadius;
//             const effectiveOuterRadius = ringIndex === 0 ? 60 : outerRadius;
//             const centralRadius = (effectiveInnerRadius + effectiveOuterRadius) / 2;

//             const angleGroups = {};
//             transformedPoints.forEach((point, pointIndex) => {
//                 const angle = point.angle !== undefined ? point.angle + rotationOffset : rotationOffset;
//                 const angleKey = angle.toFixed(8);
//                 if (!angleGroups[angleKey]) {
//                     angleGroups[angleKey] = [];
//                 }
//                 angleGroups[angleKey].push({ point, pointIndex, angle });
//             });

//             Object.values(angleGroups).forEach(group => {
//                 const numCoinciding = group.length;
//                 group.forEach(({ point, pointIndex, angle }, index) => {
//                     const originalPoint = points[pointIndex];

//                     let radius = centralRadius;
//                     if (numCoinciding > 1) {
//                         const offsetStep = 3;
//                         const offset = ((index - (numCoinciding - 1) / 2) * offsetStep);
//                         radius += offset;
//                     }

//                     radius = Math.max(effectiveInnerRadius, Math.min(effectiveOuterRadius, radius));

//                     const x = radius * Math.cos(angle);
//                     const y = radius * Math.sin(angle);

//                     if (isNaN(x) || isNaN(y)) {
//                         console.warn(`Invalid position for point ${point.Point_ID}`);
//                         return;
//                     }

//                     positions.push({
//                         point: originalPoint,
//                         transformedPoint: point,
//                         x,
//                         y,
//                         sectorIndex: 0,
//                         angle
//                     });
//                 });
//             });
//         } else if (viewMode === 'normal') {
//             // [MODIFIED normal view mode case for horizontal/angular spread]
//             const sectorCounts = Array(sectors).fill(0);
//             const pointsBySector = {};

//             // 1. Group points by sector and calculate point magnitude 

//             transformedPoints.forEach((point, pointIndex) => {
//                 try {
//                     const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
//                     if (sectorIndex >= 0 && sectorIndex < sectors) {
//                         sectorCounts[sectorIndex]++;
//                         if (!pointsBySector[sectorIndex]) {
//                             pointsBySector[sectorIndex] = [];
//                         }

//                         // Calculate magnitude for this point based on its relevant coordinates
//                         const relevantCoords = Object.entries(point)
//                             .filter(([key, value]) =>
//                                 key !== "Point_ID" &&
//                                 !key.endsWith('_binary') &&
//                                 typeof value === 'number'
//                             )
//                             .slice(0, D)
//                             .map(([_, value]) => value);

//                         let magnitude = 0;
//                         if (relevantCoords.length > 0) {
//                             magnitude = Math.sqrt(relevantCoords.reduce((sum, val) => sum + val * val, 0));
//                         }

//                         pointsBySector[sectorIndex].push({
//                             point: points[pointIndex],
//                             transformedPoint: point,
//                             magnitude: magnitude, // Store magnitude for later use
//                             pointIndex
//                         });
//                     }
//                 } catch (error) {
//                     console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
//                 }
//             });

//             const sectorsToRender = showEmptySectors ?
//                 Array.from({ length: sectors }, (_, i) => i) :
//                 Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

//             const anglePerSector = 2 * Math.PI / (showEmptySectors ? sectors : sectorsToRender.length);

//             Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
//                 const sectorIdx = parseInt(sectorIndex);

//                 let displayIndex = sectorIdx;
//                 if (!showEmptySectors) {
//                     displayIndex = sectorsToRender.indexOf(sectorIdx);
//                     if (displayIndex === -1) return;
//                 }

//                 const startAngle = (anglePerSector * displayIndex) + rotationOffset;
//                 const endAngle = startAngle + anglePerSector;

//                 // Proxy for sector sign based on MSB:
//                 const isPositiveSector = sectorIdx >= (2 ** (D - 1));
//                 const radiusSpan = outerRadius - innerRadius;

//                 sectorPoints.forEach(({ point, transformedPoint, magnitude }, i) => {
//                     // --- STEP A & B: CALCULATE NORMALIZED VALUE (V_normalized) ---
//                     // V_raw: Normalized magnitude [0, 1] using RING MAX (globalMaxMag)
//                     const V_raw = magnitude / globalMaxMag;

//                     let V_normalized;
//                     if (isPositiveSector) {
//                         // Positive Sector (0 to 1): Min magnitude (0) -> start angle, Max magnitude (1) -> end angle
//                         V_normalized = V_raw;
//                     } else {
//                         // Negative Sector (-1 to 0): Max magnitude (-1) -> start angle, Min magnitude (0) -> end angle
//                         // This requires the magnitude scale to be inverted for angular mapping.
//                         V_normalized = 1.0 - V_raw;
//                     }


//                     // --- STEP C: CALCULATE ANGLE AND RADIUS ---

//                     // Angular position: Map V_normalized [0, 1] to the angular range [startAngle, endAngle]
//                     const angleSpreadFactor = 0.8; // Use 80% of the angle for spreading
//                     const angleMargin = anglePerSector * (1 - angleSpreadFactor) / 2;
//                     const angleSpan = anglePerSector * angleSpreadFactor;

//                     // The point's value is mapped to its horizontal position within the sector
//                     const angle = startAngle + angleMargin + (V_normalized * angleSpan);


//                     // Radial position: Fixed mid-radius (Horizontal Arc)
//                     const radius = fixedMidRadius;


//                     const x = radius * Math.cos(angle);
//                     const y = radius * Math.sin(angle);

//                     positions.push({
//                         point,
//                         transformedPoint,
//                         x,
//                         y,
//                         sectorIndex: sectorIdx,
//                         angle: angle
//                     });
//                 });
//             });
//         } else if (viewMode === 'proportional' && sectorAngles) {
//             // [MODIFIED proportional view mode case for horizontal/angular spread]
//             const pointsBySector = {};

//             // 1. Group points by sector and calculate point magnitude 

//             transformedPoints.forEach((point, index) => {
//                 try {
//                     const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
//                     if (!pointsBySector[sectorIndex]) {
//                         pointsBySector[sectorIndex] = [];
//                     }

//                     // Calculate magnitude for this point based on its relevant coordinates
//                     const relevantCoords = Object.entries(point)
//                         .filter(([key, value]) =>
//                             key !== "Point_ID" &&
//                             !key.endsWith('_binary') &&
//                             typeof value === 'number'
//                         )
//                         .slice(0, D)
//                         .map(([_, value]) => value);

//                     let magnitude = 0;
//                     if (relevantCoords.length > 0) {
//                         magnitude = Math.sqrt(relevantCoords.reduce((sum, val) => sum + val * val, 0));
//                     }

//                     pointsBySector[sectorIndex].push({
//                         point: points[index],
//                         transformedPoint: point,
//                         magnitude: magnitude, // Store magnitude for later use
//                         index
//                     });
//                 } catch (error) {
//                     console.error(`Error grouping point ${point.Point_ID} by sector:`, error);
//                 }
//             });

//             let currentAngle = rotationOffset;
//             const startAngles = sectorAngles.map((angle) => {
//                 const start = currentAngle;
//                 currentAngle += angle;
//                 return start;
//             });

//             Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
//                 const sectorIdx = parseInt(sectorIndex);
//                 const sectorAngle = sectorAngles[sectorIdx];

//                 if (!showEmptySectors && sectorAngle === 0) {
//                     return;
//                 }

//                 if (sectorAngle < 0.01) {
//                     return;
//                 }

//                 const startAngle = startAngles[sectorIdx];

//                 // Proxy for sector sign based on MSB:
//                 const isPositiveSector = sectorIdx >= (2 ** (D - 1));
//                 const radiusSpan = outerRadius - innerRadius;

//                 sectorPoints.forEach(({ point, transformedPoint, magnitude, index }, i) => {
//                     // --- STEP A & B: CALCULATE NORMALIZED VALUE (V_normalized) ---
//                     // V_raw: Normalized magnitude [0, 1] using RING MAX (globalMaxMag)
//                     const V_raw = magnitude / globalMaxMag;

//                     let V_normalized;
//                     if (isPositiveSector) {
//                         // Positive Sector (0 to 1): Min magnitude (0) -> start angle, Max magnitude (1) -> end angle
//                         V_normalized = V_raw;
//                     } else {
//                         // Negative Sector (-1 to 0): Max magnitude (-1) -> start angle, Min magnitude (0) -> end angle
//                         // This requires the magnitude scale to be inverted for angular mapping.
//                         V_normalized = 1.0 - V_raw;
//                     }


//                     // --- STEP C: CALCULATE ANGLE AND RADIUS ---

//                     // Angular position: Map V_normalized [0, 1] to the angular range [startAngle, endAngle]
//                     const angleSpreadFactor = 0.8;
//                     const angleMargin = sectorAngle * (1 - angleSpreadFactor) / 2;
//                     const angleSpan = sectorAngle * angleSpreadFactor;

//                     // The point's value is mapped to its horizontal position within the sector
//                     const angle = startAngle + angleMargin + (V_normalized * angleSpan);


//                     // Radial position: Fixed mid-radius (Horizontal Arc)
//                     const radius = fixedMidRadius;

//                     const x = radius * Math.cos(angle);
//                     const y = radius * Math.sin(angle);

//                     positions.push({
//                         point,
//                         transformedPoint,
//                         x,
//                         y,
//                         sectorIndex: sectorIdx,
//                         angle: angle
//                     });
//                 });
//             });
//         }

//         console.log(`Calculated ${positions.length} positions for ring ${ringIndex} using ${transformStrategy}`);
//         return positions;
//     } catch (error) {
//         console.error(`Error in calculatePointPositions for ring ${ringIndex}:`, error);
//         return [];
//     }
// };

// // Export all transformation functions for backward compatibility
// export {
//     transformPositiveNegative,
//     transformZScore,
//     transformPercentile,
//     transformCustomThreshold,
//     transformRadial,
//     transformDecisionTree
// };

import * as d3 from "d3";

import { transformPositiveNegative } from './options/PosNeg.js';
import { transformZScore } from './options/zScore.js';
import { transformPercentile } from './options/Percentile.js';
import { transformCustomThreshold } from './options/CustomThreshold.js';
import { transformRadial } from './options/Radial.js';
import { transformDecisionTree } from "./options/DecisionTree.js";

export const CoordinateTransforms = {
    POSITIVE_NEGATIVE: 'positive_negative',
    Z_SCORE: 'z_score',
    PERCENTILE: 'percentile',
    CUSTOM_THRESHOLD: 'custom_threshold',
    RADIAL: 'radial',
    DECISION_TREE: 'decision_tree'
};


export const transformCoordinates = (points, strategy, options = {}) => {
    try {
        switch (strategy) {
            case CoordinateTransforms.POSITIVE_NEGATIVE:
                return transformPositiveNegative(points);
            case CoordinateTransforms.Z_SCORE:
                return transformZScore(points, options.threshold || 0);
            case CoordinateTransforms.PERCENTILE:
                return transformPercentile(points, options.percentile || 50);
            case CoordinateTransforms.CUSTOM_THRESHOLD:
                return transformCustomThreshold(points, options.threshold || 0);
            case CoordinateTransforms.RADIAL:
                return transformRadial(points, options);
            case CoordinateTransforms.DECISION_TREE:
                return transformDecisionTree(points, options);
            default:
                console.warn(`Unknown transformation strategy: ${strategy}, using positive_negative`);
                return transformPositiveNegative(points);
        }
    } catch (error) {
        console.error(`Error in coordinate transformation (${strategy}):`, error);
        console.warn('Falling back to positive_negative transformation');
        return transformPositiveNegative(points);
    }
};

// Enhanced bit vector generation with decision tree support
export const generateBitVector = (point, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
    let coordinates;

    if (strategy === CoordinateTransforms.DECISION_TREE) {
        if (useTransformed && point.nodeAssignments) {
            // Use node path to create binary vector
            const binaryPath = point.nodeAssignments.map((assignment, index) => {
                return (assignment.nodeId % 2).toString();
            }).join('');
            return binaryPath || '0';
        } else {
            coordinates = Object.entries(point).filter(([key, value]) =>
                key !== "Point_ID" &&
                key !== "nodeAssignments" &&
                key !== "treePath" &&
                key !== "predicted_class" &&
                key !== "nodePath" &&
                key !== "decisionPath" &&
                key !== "finalSector" &&
                typeof value === 'number' &&
                !isNaN(value)
            );
        }
    } else {
        coordinates = Object.entries(point).filter(([key]) => {
            if (useTransformed) {
                return key.endsWith('_binary');
            }
            return key !== "Point_ID" && !key.endsWith('_binary');
        });
    }

    if (!coordinates || coordinates.length === 0) {
        console.warn(`No coordinates found for point ${point.Point_ID} with strategy ${strategy}, useTransformed: ${useTransformed}`);
        coordinates = Object.entries(point).filter(([key, value]) =>
            key !== "Point_ID" &&
            typeof value === 'number' &&
            !isNaN(value)
        );
    }

    let bitVector;
    if (useTransformed && strategy === CoordinateTransforms.DECISION_TREE) {
        bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
    } else if (useTransformed) {
        bitVector = coordinates.map(([_, value]) => String(value)).join("");
    } else {
        bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
    }

    return bitVector || '0';
};

// Enhanced sector point counts calculation with decision tree support
export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {
    if (transformStrategy === CoordinateTransforms.RADIAL) {
        return pointsData.map(ringData => [ringData.points.length]);
    }


    if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
        // For decision tree, calculate counts based on nodes at each depth
        return pointsData.map((ringData, ringIndex) => {
            try {
                const sectors = ringData.sectors || ringData.nodes?.length || 1;
                const counts = Array(sectors).fill(0);

                (ringData.points || []).forEach(point => {
                    try {
                        if (point.nodeAssignments) {
                            const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
                            if (assignment) {
                                // Use sectorIndex instead of nodeId
                                const sectorIndex = assignment.sectorIndex !== undefined ? assignment.sectorIndex : assignment.nodeId;

                                if (sectorIndex >= 0 && sectorIndex < sectors) {
                                    counts[sectorIndex]++;
                                } else {
                                    console.warn(`Invalid sectorIndex ${sectorIndex} for point ${point.Point_ID} at depth ${ringIndex} (max sectors: ${sectors})`);
                                }
                            } else {
                                console.warn(`No assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
                            }
                        } else {
                            console.warn(`No nodeAssignments for point ${point.Point_ID}`);
                        }
                    } catch (error) {
                        console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
                    }
                });
                console.log("calculate sector point function here")
                console.log(`Ring ${ringIndex} (Decision Tree): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} nodes`);
                return counts;
            } catch (error) {
                console.error(`Error processing ring ${ringIndex} with decision tree:`, error);
                return Array(ringData.sectors || 1).fill(0);
            }
        });
    }

    return pointsData.map((ringData, index) => {
        try {
            let pointsToCount = ringData.points;
            pointsToCount = transformCoordinates(ringData.points, transformStrategy, transformOptions);

            const sectors = ringData.sectors || 2 ** (index + 1);
            const counts = Array(sectors).fill(0);

            pointsToCount.forEach(point => {
                try {
                    const sectorIndex = calculateSectorIndex(point, index, true, transformStrategy);
                    if (sectorIndex >= 0 && sectorIndex < sectors) {
                        counts[sectorIndex]++;
                    } else {
                        console.warn(`Invalid sector index ${sectorIndex} for point ${point.Point_ID} in ring ${index}`);
                    }
                } catch (error) {
                    console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
                }
            });

            console.log(`Ring ${index} (${transformStrategy}): ${counts.reduce((a, b) => a + b, 0)} points across ${sectors} sectors`);
            return counts;
        } catch (error) {
            console.error(`Error processing ring ${index} with strategy ${transformStrategy}:`, error);
            const sectors = 2 ** (index + 1);
            return Array(sectors).fill(0);
        }
    });
};

// Enhanced sector index calculation with decision tree support
export const calculateSectorIndex = (point, ringIndex, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
    if (strategy === CoordinateTransforms.DECISION_TREE) {
        if (point.nodeAssignments) {
            const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
            if (assignment) {
                return assignment.nodeId;
            }
            console.warn(`No node assignment found for point ${point.Point_ID} at depth ${ringIndex}`);
        } else {
            console.warn(`No nodeAssignments for point ${point.Point_ID}`);
        }
        return 0;
    }

    const bitVector = generateBitVector(point, useTransformed, strategy);

    if (bitVector.length === 0) {
        console.warn(`Empty bit vector for point ${point.Point_ID}, returning sector 0`);
        return 0;
    }

    const sectors = 2 ** (ringIndex + 1);
    const binaryValue = parseInt(bitVector, 2) || 0;
    const sectorIndex = Math.min(binaryValue, sectors - 1);

    return sectorIndex;
};
// Helper function to get active sector mapping for point positioning
export const getActiveSectorMapping = (sectorCounts, showEmptySectors = true) => {
    const activeMaps = [];

    sectorCounts.forEach((counts, ringIndex) => {
        if (showEmptySectors) {
            activeMaps[ringIndex] = Array.from({ length: counts.length }, (_, i) => i);
        } else {
            activeMaps[ringIndex] = counts
                .map((count, index) => count > 0 ? index : -1)
                .filter(index => index !== -1);
        }
    });

    return activeMaps;
};

// Fixed proportional sector angles calculation that maintains hierarchical structure
export const calculateProportionalSectorAngles = (sectorCounts, showEmptySectors = true) => {
    const sectorAngles = [];
    const lastRingIndex = sectorCounts.length - 1;

    const activeSectorMaps = [];

    for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
        const currentCounts = sectorCounts[ringIndex];
        const sectors = currentCounts.length;

        if (sectors === 1) {
            sectorAngles[ringIndex] = [359 * Math.PI / 180];
            activeSectorMaps[ringIndex] = [0];
            continue;
        }

        const totalPoints = currentCounts.reduce((sum, count) => sum + count, 0) || 1;
        const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

        if (ringIndex === lastRingIndex) {
            if (showEmptySectors) {
                const emptySectors = currentCounts.filter(count => count === 0).length;
                const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

                const angles = currentCounts.map(count => {
                    return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
                });

                sectorAngles[ringIndex] = angles;
                activeSectorMaps[ringIndex] = Array.from({ length: sectors }, (_, i) => i);
            } else {
                const activeSectors = [];
                const activeAngles = [];

                currentCounts.forEach((count, index) => {
                    if (count > 0) {
                        activeSectors.push(index);
                        activeAngles.push((count / totalPoints) * 2 * Math.PI);
                    }
                });

                const angles = Array(sectors).fill(0);
                activeSectors.forEach((sectorIndex, i) => {
                    angles[sectorIndex] = activeAngles[i];
                });

                sectorAngles[ringIndex] = angles;
                activeSectorMaps[ringIndex] = activeSectors;
            }
        } else {
            const outerAngles = sectorAngles[ringIndex + 1];
            const outerActiveSectors = activeSectorMaps[ringIndex + 1];
            const innerSectors = sectors;
            const outerSectors = outerAngles.length;

            if (outerSectors === 0 || outerActiveSectors.length === 0) {
                const uniformAngle = 2 * Math.PI / innerSectors;
                sectorAngles[ringIndex] = Array(innerSectors).fill(uniformAngle);
                activeSectorMaps[ringIndex] = Array.from({ length: innerSectors }, (_, i) => i);
                continue;
            }

            const ratio = outerSectors / innerSectors;
            const angles = Array(innerSectors).fill(0);
            const activeSectors = [];

            for (let i = 0; i < innerSectors; i++) {
                let sumAngle = 0;
                let hasActiveChild = false;

                for (let j = 0; j < ratio && (i * ratio + j) < outerSectors; j++) {
                    const outerIdx = Math.floor(i * ratio + j);
                    const outerAngle = outerAngles[outerIdx] || 0;
                    sumAngle += outerAngle;

                    if (outerActiveSectors.includes(outerIdx) && outerAngle > 0) {
                        hasActiveChild = true;
                    }
                }

                if (showEmptySectors || hasActiveChild || currentCounts[i] > 0) {
                    angles[i] = sumAngle || (2 * Math.PI / innerSectors);
                    if (hasActiveChild || currentCounts[i] > 0) {
                        activeSectors.push(i);
                    }
                } else {
                    angles[i] = 0;
                }
            }

            sectorAngles[ringIndex] = angles;
            activeSectorMaps[ringIndex] = activeSectors;
        }
    }

    console.log('Proportional angles calculation:', {
        showEmptySectors,
        sectorAngles: sectorAngles.map((angles, i) => ({
            ring: i,
            angles: angles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
            activeSectors: activeSectorMaps[i],
            totalAngle: (angles.reduce((sum, a) => sum + a, 0) * 180 / Math.PI).toFixed(2) + '°'
        }))
    });

    return sectorAngles;
};

export const generateRingStructure = (jsonData, transformStrategy = null, transformOptions = {}, labelsData = null) => {
    if (!jsonData) {
        console.error("No jsonData provided to generateRingStructure.");
        return [];
    }
    if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
        console.log("=== GENERATING DECISION TREE RING STRUCTURE ===");
        const allPoints = Object.values(jsonData).flat();
        console.log(`Processing ${allPoints.length} points for decision tree`);
        const result = transformDecisionTree(allPoints, { ...transformOptions, labelsData });
        const { tree, transformedPoints } = result;

        if (!tree || !tree.levels || tree.levels.length === 0) {
            console.warn("No valid tree levels generated.");
            return [];
        }

        const rings = [];

        // Root ring (depth 0, single node)
        const rootPoints = transformedPoints.filter(p =>
            p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === 0)
        );

        rings.push({
            key: `TreeRoot`,
            points: rootPoints,
            dimensions: 1,
            subspaceId: `TreeRoot`,
            ringIndex: 0,
            sectors: 1, // Root has only 1 sector (whole circle)
            structure: result.structure,
            nodes: tree.levels[0] || [] // Root node(s)
        });

        // Rings for depths 1 to max depth
        for (let depth = 1; depth < tree.levels.length; depth++) {
            const nodes = tree.levels[depth];
            const sectors = nodes.length; // Number of nodes at this depth = number of sectors
            console.log(`Depth ${depth}: ${sectors} nodes/sectors`);

            const pointsInRing = transformedPoints.filter(p => {
                return p.nodeAssignments && p.nodeAssignments.some(assignment => assignment.depth === depth);
            }).map(p => ({
                ...p,
                sectorIndex: p.nodeAssignments.find(assignment => assignment.depth === depth)?.nodeId
            }));

            rings.push({
                key: `TreeDepth${depth}`,
                points: pointsInRing,
                dimensions: depth + 1,
                subspaceId: `TreeDepth${depth}`,
                ringIndex: depth,
                sectors, // Number of nodes at this depth
                structure: result.structure,
                nodes: nodes // Store the actual nodes for reference
            });
        }

        console.log(`Generated ${rings.length} rings with sectors: ${rings.map(r => r.sectors).join(', ')}`);
        console.log(`Points per ring: ${rings.map(r => r.points.length).join(', ')}`);
        return rings;
    }
    const subspaces = Object.keys(jsonData);
    subspaces.sort((a, b) => a.length - b.length);

    return subspaces.map((key, index) => ({
        key,
        points: jsonData[key] || [],
        dimensions: key.length,
        subspaceId: key,
        ringIndex: index,
        sectors: transformStrategy === CoordinateTransforms.RADIAL ? 1 : 2 ** (index + 1)
    }));
};

// Color scheme generation
export const generateColorSchemes = (ringCount) => {
    // 1. Keep ring color same for all the rings, and make it whitish yellowish.
    const fixedRingColor = "#f6e9a8"; // A light, slightly yellow/gold color

    // The getRingColor function now returns the fixed color regardless of the index.
    const getRingColor = (index) => fixedRingColor;

    // 2. The sector saturation should remain same as dark and light.
    // We use the fixed color as the base for sector calculation.
    const baseColorForSectors = d3.hsl(fixedRingColor);

    const getSectorColor = (ringIndex, sectorIndex) => {
        // baseColor remains the fixed yellow/gold, ensuring all rings use the same base hue/saturation
        const isPositive = sectorIndex % 2 === 0;

        // The logic for dark (0.35) and light (0.75) sectors is preserved.
        // We use the hue and saturation of the fixed color, but vary the lightness (l).
        return d3.hsl(baseColorForSectors.h, baseColorForSectors.s, isPositive ? 0.90 : 0.80).toString();
    };

    return { getRingColor, getSectorColor };
};

export const calculatePointPositions = (
    points,
    ringIndex,
    innerRadius,
    outerRadius,
    sectors,
    sectorAngles = null,
    viewMode = 'normal',
    showEmptySectors = true,
    transformStrategy = CoordinateTransforms.POSITIVE_NEGATIVE,
    transformOptions = {},
    ring = null
) => {
    try {
        let transformedPoints = points;
        if (transformStrategy !== CoordinateTransforms.DECISION_TREE) {
            transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
        }

        const rotationOffset = 0;
        const positions = [];

        // --- Calculate Ring-Specific Min/Max Coordinate Value (Constant Scale) ---
        // This scale is based on the signed value of the D-th coordinate.
        const D = ringIndex + 1;
        let minCoordinateValue = Infinity;
        let maxCoordinateValue = -Infinity;

        transformedPoints.forEach(point => {
            const relevantCoords = Object.entries(point)
                .filter(([key, value]) => key !== "Point_ID" && !key.endsWith('_binary') && typeof value === 'number')
                .slice(0, D)
                .map(([_, value]) => value);

            if (relevantCoords.length > 0) {
                const coordinateValue = relevantCoords[relevantCoords.length - 1]; // Value of the D-th coordinate
                if (coordinateValue > maxCoordinateValue) {
                    maxCoordinateValue = coordinateValue;
                }
                if (coordinateValue < minCoordinateValue) {
                    minCoordinateValue = coordinateValue;
                }
            }
        });

        const coordinateRange = maxCoordinateValue - minCoordinateValue;
        // --- End Constant Scale Calculation ---

        // Calculate the fixed radius for the arc plot mode
        const fixedMidRadius = innerRadius + ((outerRadius - innerRadius) / 2);


        if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
            if (ringIndex === 0) {
                // ROOT RING (INNER CIRCLE) - Place all points in the center
                console.log(`Root ring (depth 0): Positioning ${points.length} points in inner circle`);

                const centerRadius = (innerRadius + outerRadius) / 2;
                const numPoints = points.length;

                if (numPoints === 1) {
                    // Single point at the center
                    positions.push({
                        point: points[0],
                        x: 0,
                        y: 0,
                        sectorIndex: 0,
                        angle: 0,
                        nodeId: 0
                    });
                } else {
                    // Multiple points arranged in a circle
                    points.forEach((point, idx) => {
                        const angle = (2 * Math.PI * idx) / numPoints;
                        // Add some random variation to avoid exact overlap
                        const radiusVariation = (Math.random() - 0.5) * (outerRadius - innerRadius) * 0.3;
                        const radius = Math.max(innerRadius, Math.min(outerRadius, centerRadius + radiusVariation));

                        const x = radius * Math.cos(angle);
                        const y = radius * Math.sin(angle);

                        positions.push({
                            point,
                            x,
                            y,
                            sectorIndex: 0,
                            angle,
                            nodeId: 0
                        });
                    });
                }

                console.log(`Root ring: ${positions.length} points positioned in center circle`);
                return positions;
            }

            // OUTER RINGS (depth > 0) - Place points in sectors based on tree structure
            const pointsByNode = {};
            transformedPoints.forEach((point, pointIndex) => {
                if (!point.nodeAssignments) {
                    console.warn(`No nodeAssignments for point ${point.Point_ID}`);
                    return;
                }

                const assignment = point.nodeAssignments.find(a => a.depth === ringIndex);
                if (!assignment) {
                    console.warn(`No assignment for point ${point.Point_ID} at depth ${ringIndex}`);
                    return;
                }

                const nodeId = assignment.nodeId;
                if (!pointsByNode[nodeId]) {
                    pointsByNode[nodeId] = [];
                }
                pointsByNode[nodeId].push({ point, pointIndex, assignment });
            });

            // Process each node/sector
            Object.entries(pointsByNode).forEach(([nodeId, nodePoints]) => {
                const assignment = nodePoints[0].assignment;
                const sector = assignment.sector;

                if (!sector) {
                    console.warn(`No sector info for node ${nodeId} at depth ${ringIndex}`);
                    return;
                }

                // Calculate the center angle of the sector
                const sectorCenterAngle = (sector.startAngle + sector.endAngle) / 2;
                const numPoints = nodePoints.length;

                // Place points in the sector
                nodePoints.forEach(({ point, pointIndex, assignment }, idx) => {

                    let radius;
                    let angle = sectorCenterAngle;

                    if (numPoints === 1) {
                        // Single point goes in the middle of the ring
                        radius = (innerRadius + outerRadius) / 2;
                    } else if (numPoints <= 3) {
                        // Few points: distribute radially
                        const radiusSpan = outerRadius - innerRadius;
                        const t = idx / Math.max(1, numPoints - 1);
                        radius = innerRadius + (t * radiusSpan);
                    } else {
                        // Many points: arrange in arc within the sector
                        const radiusSpan = outerRadius - innerRadius;
                        const radialLayers = Math.ceil(Math.sqrt(numPoints));
                        const pointsPerLayer = Math.ceil(numPoints / radialLayers);

                        const layerIndex = Math.floor(idx / pointsPerLayer);
                        const positionInLayer = idx % pointsPerLayer;

                        // Radius for this layer
                        radius = innerRadius + (layerIndex / Math.max(1, radialLayers - 1)) * radiusSpan;

                        // Angle variation within sector
                        const sectorWidth = sector.endAngle - sector.startAngle;
                        const maxAngleSpread = Math.min(sectorWidth * 0.8, Math.PI / 6); // Limit spread

                        if (pointsPerLayer > 1) {
                            const angleOffset = (positionInLayer / (pointsPerLayer - 1) - 0.5) * maxAngleSpread;
                            angle = sectorCenterAngle + angleOffset;
                        }
                    }

                    // Convert polar coordinates to Cartesian
                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    if (isNaN(x) || isNaN(y)) {
                        console.warn(`Invalid position for point ${point.Point_ID} at node ${nodeId}`);
                        return;
                    }

                    positions.push({
                        point,
                        x,
                        y,
                        sectorIndex: parseInt(nodeId),
                        angle,
                        nodeId: parseInt(nodeId)
                    });
                });
            });

            console.log(`Ring ${ringIndex}: ${positions.length} points positioned across ${sectors} sectors`);

        } else if (transformStrategy === CoordinateTransforms.RADIAL) {
            // [Unchanged RADIAL case]
            const effectiveInnerRadius = ringIndex === 0 ? 20 : innerRadius;
            const effectiveOuterRadius = ringIndex === 0 ? 60 : outerRadius;
            const centralRadius = (effectiveInnerRadius + effectiveOuterRadius) / 2;

            const angleGroups = {};
            transformedPoints.forEach((point, pointIndex) => {
                const angle = point.angle !== undefined ? point.angle + rotationOffset : rotationOffset;
                const angleKey = angle.toFixed(8);
                if (!angleGroups[angleKey]) {
                    angleGroups[angleKey] = [];
                }
                angleGroups[angleKey].push({ point, pointIndex, angle });
            });

            Object.values(angleGroups).forEach(group => {
                const numCoinciding = group.length;
                group.forEach(({ point, pointIndex, angle }, index) => {
                    const originalPoint = points[pointIndex];

                    let radius = centralRadius;
                    if (numCoinciding > 1) {
                        const offsetStep = 3;
                        const offset = ((index - (numCoinciding - 1) / 2) * offsetStep);
                        radius += offset;
                    }

                    radius = Math.max(effectiveInnerRadius, Math.min(effectiveOuterRadius, radius));

                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    if (isNaN(x) || isNaN(y)) {
                        console.warn(`Invalid position for point ${point.Point_ID}`);
                        return;
                    }

                    positions.push({
                        point: originalPoint,
                        transformedPoint: point,
                        x,
                        y,
                        sectorIndex: 0,
                        angle
                    });
                });
            });
        } else if (viewMode === 'normal') {
            // [MODIFIED normal view mode case for horizontal/angular spread using signed value]
            const sectorCounts = Array(sectors).fill(0);
            const pointsBySector = {};

            // 1. Group points by sector and calculate point magnitude 

            transformedPoints.forEach((point, pointIndex) => {
                try {
                    const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
                    if (sectorIndex >= 0 && sectorIndex < sectors) {
                        sectorCounts[sectorIndex]++;
                        if (!pointsBySector[sectorIndex]) {
                            pointsBySector[sectorIndex] = [];
                        }

                        // Get the D-th coordinate for linear scaling
                        const relevantCoords = Object.entries(point)
                            .filter(([key, value]) =>
                                key !== "Point_ID" &&
                                !key.endsWith('_binary') &&
                                typeof value === 'number'
                            )
                            .slice(0, D)
                            .map(([_, value]) => value);

                        let coordinateValue = 0;
                        if (relevantCoords.length > 0) {
                            coordinateValue = relevantCoords[relevantCoords.length - 1];
                        }

                        pointsBySector[sectorIndex].push({
                            point: points[pointIndex],
                            transformedPoint: point,
                            coordinateValue: coordinateValue, // Store signed coordinate value
                            pointIndex
                        });
                    }
                } catch (error) {
                    console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
                }
            });

            const sectorsToRender = showEmptySectors ?
                Array.from({ length: sectors }, (_, i) => i) :
                Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

            const anglePerSector = 2 * Math.PI / (showEmptySectors ? sectors : sectorsToRender.length);

            Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
                const sectorIdx = parseInt(sectorIndex);

                let displayIndex = sectorIdx;
                if (!showEmptySectors) {
                    displayIndex = sectorsToRender.indexOf(sectorIdx);
                    if (displayIndex === -1) return;
                }

                const startAngle = (anglePerSector * displayIndex) + rotationOffset;
                const endAngle = startAngle + anglePerSector;

                const radiusSpan = outerRadius - innerRadius;

                sectorPoints.forEach(({ point, transformedPoint, coordinateValue }, i) => {
                    // --- STEP A & B: CALCULATE NORMALIZED VALUE (V_normalized) ---

                    let V_normalized = 0.5;

                    if (coordinateRange > 1e-6) {
                        // Linear normalization: Smallest value -> 0 (start angle), Largest value -> 1 (end angle)
                        V_normalized = (coordinateValue - minCoordinateValue) / coordinateRange;
                    }


                    // --- STEP C: CALCULATE ANGLE AND RADIUS ---

                    // Angular position: Map V_normalized [0, 1] to the angular range [startAngle, endAngle]
                    const angleSpreadFactor = 0.9;
                    const angleMargin = anglePerSector * (1 - angleSpreadFactor) / 2;
                    const angleSpan = anglePerSector * angleSpreadFactor;

                    // The point's value is mapped to its horizontal position within the sector
                    const angle = startAngle + angleMargin + (V_normalized * angleSpan);


                    // Radial position: Fixed mid-radius (Horizontal Arc)
                    const radius = fixedMidRadius;


                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    positions.push({
                        point,
                        transformedPoint,
                        x,
                        y,
                        sectorIndex: sectorIdx,
                        angle: angle
                    });
                });
            });
        } else if (viewMode === 'proportional' && sectorAngles) {
            // [MODIFIED proportional view mode case for horizontal/angular spread using signed value]
            const pointsBySector = {};

            // 1. Group points by sector and calculate point magnitude 

            transformedPoints.forEach((point, index) => {
                try {
                    const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
                    if (!pointsBySector[sectorIndex]) {
                        pointsBySector[sectorIndex] = [];
                    }

                    // Get the D-th coordinate for linear scaling
                    const relevantCoords = Object.entries(point)
                        .filter(([key, value]) =>
                            key !== "Point_ID" &&
                            !key.endsWith('_binary') &&
                            typeof value === 'number'
                        )
                        .slice(0, D)
                        .map(([_, value]) => value);

                    let coordinateValue = 0;
                    if (relevantCoords.length > 0) {
                        coordinateValue = relevantCoords[relevantCoords.length - 1];
                    }

                    pointsBySector[sectorIndex].push({
                        point: points[index],
                        transformedPoint: point,
                        coordinateValue: coordinateValue, // Store signed coordinate value
                        index
                    });
                } catch (error) {
                    console.error(`Error grouping point ${point.Point_ID} by sector:`, error);
                }
            });

            let currentAngle = rotationOffset;
            const startAngles = sectorAngles.map((angle) => {
                const start = currentAngle;
                currentAngle += angle;
                return start;
            });

            Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
                const sectorIdx = parseInt(sectorIndex);
                const sectorAngle = sectorAngles[sectorIdx];

                if (!showEmptySectors && sectorAngle === 0) {
                    return;
                }

                if (sectorAngle < 0.01) {
                    return;
                }

                const startAngle = startAngles[sectorIdx];

                const radiusSpan = outerRadius - innerRadius;

                sectorPoints.forEach(({ point, transformedPoint, coordinateValue, index }, i) => {
                    // --- STEP A & B: CALCULATE NORMALIZED VALUE (V_normalized) ---

                    let V_normalized = 0.5;

                    if (coordinateRange > 1e-6) {
                        // Linear normalization: Smallest value -> 0 (start angle), Largest value -> 1 (end angle)
                        V_normalized = (coordinateValue - minCoordinateValue) / coordinateRange;
                    }


                    // --- STEP C: CALCULATE ANGLE AND RADIUS ---

                    // Angular position: Map V_normalized [0, 1] to the angular range [startAngle, endAngle]
                    const angleSpreadFactor = 0.9;
                    const angleMargin = sectorAngle * (1 - angleSpreadFactor) / 2;
                    const angleSpan = sectorAngle * angleSpreadFactor;

                    // The point's value is mapped to its horizontal position within the sector
                    const angle = startAngle + angleMargin + (V_normalized * angleSpan);


                    // Radial position: Fixed mid-radius (Horizontal Arc)
                    const radius = fixedMidRadius;

                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    positions.push({
                        point,
                        transformedPoint,
                        x,
                        y,
                        sectorIndex: sectorIdx,
                        angle: angle
                    });
                });
            });
        }

        console.log(`Calculated ${positions.length} positions for ring ${ringIndex} using ${transformStrategy}`);
        return positions;
    } catch (error) {
        console.error(`Error in calculatePointPositions for ring ${ringIndex}:`, error);
        return [];
    }
};

// Export all transformation functions for backward compatibility
export {
    transformPositiveNegative,
    transformZScore,
    transformPercentile,
    transformCustomThreshold,
    transformRadial,
    transformDecisionTree
};