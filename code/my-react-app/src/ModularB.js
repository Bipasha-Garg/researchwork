// import * as d3 from "d3";
// import { transformPositiveNegative } from './options/PosNeg.js';
// import { transformZScore } from './options/zScore.js';
// import { transformPercentile } from './options/Percentile.js';
// import { transformCustomThreshold } from './options/CustomThreshold.js';
// import { transformRadial } from './options/Radial.js';
// import { transformDecisionTree } from "./options/DecisionTree.js";

// // Coordinate transformation constants
// export const CoordinateTransforms = {
//     POSITIVE_NEGATIVE: 'positive_negative',
//     Z_SCORE: 'z_score',
//     PERCENTILE: 'percentile',
//     CUSTOM_THRESHOLD: 'custom_threshold',
//     RADIAL: 'radial',
//     DECISION_TREE: 'decision_tree'
// };

// // Main coordinate transformation function
// export const transformCoordinates = (points, strategy, options = {}) => {
//     switch (strategy) {
//         case CoordinateTransforms.POSITIVE_NEGATIVE:
//             return transformPositiveNegative(points);
//         case CoordinateTransforms.Z_SCORE:
//             return transformZScore(points, options.threshold || 0);
//         case CoordinateTransforms.PERCENTILE:
//             return transformPercentile(points, options.percentile || 50);
//         case CoordinateTransforms.CUSTOM_THRESHOLD:
//             return transformCustomThreshold(points, options.threshold || 0);
//         case CoordinateTransforms.RADIAL:
//             return transformRadial(points, options);
//         case CoordinateTransforms.DECISION_TREE:
//             return transformDecisionTree(points, options);
//         default:
//             return transformPositiveNegative(points);
//     }
// };

// // Bit vector generation - common utility function
// export const generateBitVector = (point, useTransformed = true) => {
//     const coordinates = Object.entries(point).filter(([key]) => {
//         if (useTransformed) {
//             return key.endsWith('_binary');
//         }
//         return key !== "Point_ID" && !key.endsWith('_binary');
//     });

//     if (useTransformed) {
//         const bitVector = coordinates.map(([_, value]) => value).join("");
//         console.log(`Point ${point.Point_ID}, Bit Vector: ${bitVector}`);
//         return bitVector;
//     } else {
//         const bitVector = coordinates.map(([_, value]) => (value >= 0 ? 1 : 0)).join("");
//         console.log(`Point ${point.Point_ID}, Bit Vector (untransformed): ${bitVector}`);
//         return bitVector;
//     }
// };

// // Sector index calculation - common utility function
// export const calculateSectorIndex = (point, ringIndex, useTransformed = true) => {
//     const bitVector = generateBitVector(point, useTransformed);
//     const sectors = 2 ** (ringIndex + 1);
//     const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);
//     console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
//     return sectorIndex;
// };

// // Sector point counts calculation
// export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {

//     if (transformStrategy === CoordinateTransforms.RADIAL) {
//         return pointsData.map(ringData => [ringData.points.length]);
//     }

//     return pointsData.map((ringData, index) => {
//         const transformedPoints = transformCoordinates(ringData.points, transformStrategy, transformOptions);
//         const sectors = 2 ** (index + 1);
//         const counts = Array(sectors).fill(0);

//         transformedPoints.forEach(point => {
//             const sectorIndex = calculateSectorIndex(point, index, true);
//             counts[sectorIndex]++;
//         });

//         return counts;
//     });
// };

// // Helper function to get active sector mapping for point positioning
// export const getActiveSectorMapping = (sectorCounts, showEmptySectors = true) => {
//     const activeMaps = [];

//     sectorCounts.forEach((counts, ringIndex) => {
//         if (showEmptySectors) {
//             // All sectors are "active" when showing empty ones
//             activeMaps[ringIndex] = Array.from({ length: counts.length }, (_, i) => i);
//         } else {
//             // Only non-empty sectors are active
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

//     // Track which sectors are active (non-empty) for hierarchical mapping
//     const activeSectorMaps = [];

//     for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
//         const currentCounts = sectorCounts[ringIndex];
//         const sectors = currentCounts.length;

//         // Handle single sector case (radial transform)
//         if (sectors === 1) {
//             sectorAngles[ringIndex] = [359 * Math.PI / 180];
//             activeSectorMaps[ringIndex] = [0]; // Single active sector
//             continue;
//         }

//         const totalPoints = currentCounts.reduce((sum, count) => sum + count, 0) || 1;
//         const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

//         if (ringIndex === lastRingIndex) {
//             // Outermost ring - calculate angles based on point counts
//             if (showEmptySectors) {
//                 // Show all sectors with minimum angle for empty ones
//                 const emptySectors = currentCounts.filter(count => count === 0).length;
//                 const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

//                 const angles = currentCounts.map(count => {
//                     return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
//                 });

//                 sectorAngles[ringIndex] = angles;
//                 activeSectorMaps[ringIndex] = Array.from({ length: sectors }, (_, i) => i);
//             } else {
//                 // Only show non-empty sectors
//                 const activeSectors = [];
//                 const activeAngles = [];

//                 currentCounts.forEach((count, index) => {
//                     if (count > 0) {
//                         activeSectors.push(index);
//                         activeAngles.push((count / totalPoints) * 2 * Math.PI);
//                     }
//                 });

//                 // Create full angle array with zeros for empty sectors
//                 const angles = Array(sectors).fill(0);
//                 activeSectors.forEach((sectorIndex, i) => {
//                     angles[sectorIndex] = activeAngles[i];
//                 });

//                 sectorAngles[ringIndex] = angles;
//                 activeSectorMaps[ringIndex] = activeSectors;
//             }
//         } else {
//             // Inner rings - maintain hierarchical relationship
//             const outerAngles = sectorAngles[ringIndex + 1];
//             const outerActiveSectors = activeSectorMaps[ringIndex + 1];
//             const innerSectors = sectors;
//             const outerSectors = outerAngles.length;

//             if (outerSectors === 0 || outerActiveSectors.length === 0) {
//                 // Fallback if no outer sectors
//                 const uniformAngle = 2 * Math.PI / innerSectors;
//                 sectorAngles[ringIndex] = Array(innerSectors).fill(uniformAngle);
//                 activeSectorMaps[ringIndex] = Array.from({ length: innerSectors }, (_, i) => i);
//                 continue;
//             }

//             // Calculate hierarchical mapping
//             const ratio = outerSectors / innerSectors;
//             const angles = Array(innerSectors).fill(0);
//             const activeSectors = [];

//             for (let i = 0; i < innerSectors; i++) {
//                 let sumAngle = 0;
//                 let hasActiveChild = false;

//                 // Sum angles from corresponding outer sectors
//                 for (let j = 0; j < ratio && (i * ratio + j) < outerSectors; j++) {
//                     const outerIdx = Math.floor(i * ratio + j);
//                     const outerAngle = outerAngles[outerIdx] || 0;
//                     sumAngle += outerAngle;

//                     // Check if this outer sector is active
//                     if (outerActiveSectors.includes(outerIdx) && outerAngle > 0) {
//                         hasActiveChild = true;
//                     }
//                 }

//                 // Only include this inner sector if it has active children or we're showing empty sectors
//                 if (showEmptySectors || hasActiveChild || currentCounts[i] > 0) {
//                     angles[i] = sumAngle || (2 * Math.PI / innerSectors);
//                     if (hasActiveChild || currentCounts[i] > 0) {
//                         activeSectors.push(i);
//                     }
//                 } else {
//                     angles[i] = 0; // No angle for inactive sectors when not showing empty
//                 }
//             }

//             sectorAngles[ringIndex] = angles;
//             activeSectorMaps[ringIndex] = activeSectors;
//         }
//     }

//     // Debug logging
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

// // Ring structure generation
// export const generateRingStructure = (jsonData, transformStrategy = null, transformOptions = {}, labelsData = null) => {


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
//     const ringColorScale = d3.scaleSequential(d3.interpolatePlasma).domain([ringCount, 0]);

//     const getRingColor = (index) => d3.color(ringColorScale(index));

//     const getSectorColor = (ringIndex, sectorIndex) => {
//         const baseColor = d3.hsl(getRingColor(ringIndex));
//         const isPositive = sectorIndex % 2 === 0;
//         return d3.hsl(baseColor.h, baseColor.s, isPositive ? 0.75 : 0.35).toString();
//     };

//     return { getRingColor, getSectorColor };
// };

// // Point positions calculation
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


//     const transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
//     const rotationOffset = 0; // 0° at 3 o'clock
//     const positions = [];

//     if (transformStrategy === CoordinateTransforms.RADIAL) {
//         console.log(`Calculating positions for ring ${ringIndex}, points: ${points.length}, innerRadius: ${innerRadius}, outerRadius: ${outerRadius}`);

//         // Set default radii for the innermost circle (ringIndex === 0)
//         const effectiveInnerRadius = ringIndex === 0 ? 20 : innerRadius; // Default inner radius for innermost circle
//         const effectiveOuterRadius = ringIndex === 0 ? 60 : outerRadius; // Default outer radius for innermost circle

//         // Calculate the central radius of the ring
//         const centralRadius = (effectiveInnerRadius + effectiveOuterRadius) / 2;

//         // Group points by angle to detect coinciding points
//         const angleGroups = {};
//         transformedPoints.forEach((point, pointIndex) => {
//             const angle = point.angle !== undefined ? point.angle + rotationOffset : rotationOffset;
//             const angleKey = angle.toFixed(8); // Use fixed precision to handle floating-point issues
//             if (!angleGroups[angleKey]) {
//                 angleGroups[angleKey] = [];
//             }
//             angleGroups[angleKey].push({ point, pointIndex, angle });
//         });

//         // Process each group of points
//         Object.values(angleGroups).forEach(group => {
//             const numCoinciding = group.length;
//             group.forEach(({ point, pointIndex, angle }, index) => {
//                 const originalPoint = points[pointIndex];

//                 // For coinciding points, offset radius slightly
//                 let radius = centralRadius;
//                 if (numCoinciding > 1) {
//                     const offsetStep = 3; // Small radial offset (adjustable)
//                     // Spread points around centralRadius: e.g., -5, 0, +5 for 3 points
//                     const offset = ((index - (numCoinciding - 1) / 2) * offsetStep);
//                     radius += offset;
//                 }

//                 // Ensure radius stays within bounds
//                 radius = Math.max(effectiveInnerRadius, Math.min(effectiveOuterRadius, radius));

//                 // Anticlockwise from 3 o'clock: x = cos(angle), y = sin(angle)
//                 const x = radius * Math.cos(angle);
//                 const y = radius * Math.sin(angle);

//                 if (isNaN(x) || isNaN(y)) {
//                     console.warn(`Invalid position for point ${point.Point_ID}: radius=${radius}, angle=${(angle * 180 / Math.PI).toFixed(2)}°, x=${x}, y=${y}`);
//                     return;
//                 }

//                 positions.push({
//                     point: originalPoint,
//                     transformedPoint: point,
//                     x,
//                     y,
//                     sectorIndex: 0, // No sectors
//                     angle
//                 });

//                 console.log(`Point ${point.Point_ID} at ring ${ringIndex}: angle=${(angle * 180 / Math.PI).toFixed(2)}°, x=${x.toFixed(2)}, y=${y.toFixed(2)}, radius=${radius.toFixed(2)}`);
//             });
//         });
//     }
//     else if (viewMode === 'normal') {
//         const sectorCounts = Array(sectors).fill(0);
//         transformedPoints.forEach(point => {
//             const sectorIndex = calculateSectorIndex(point, ringIndex, true);
//             sectorCounts[sectorIndex]++;
//         });

//         const sectorsToRender = showEmptySectors ?
//             Array.from({ length: sectors }, (_, i) => i) :
//             Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

//         const anglePerSector = 2 * Math.PI / (showEmptySectors ? sectors : sectorsToRender.length);

//         transformedPoints.forEach((point, pointIndex) => {
//             const originalPoint = points[pointIndex];
//             const sectorIndex = calculateSectorIndex(point, ringIndex, true);

//             let displayIndex = sectorIndex;
//             if (!showEmptySectors) {
//                 displayIndex = sectorsToRender.indexOf(sectorIndex);
//                 if (displayIndex === -1) return;
//             }

//             const startAngle = (anglePerSector * displayIndex) + rotationOffset;
//             const centerAngle = startAngle + (anglePerSector / 2);

//             const clusterFactor = 0.9;
//             const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * (pointIndex % points.length)) / points.length;

//             const x = radius * Math.cos(centerAngle);
//             const y = radius * Math.sin(centerAngle);

//             positions.push({
//                 point: originalPoint,
//                 transformedPoint: point,
//                 x,
//                 y,
//                 sectorIndex,
//                 angle: centerAngle
//             });
//         });
//     } else if (viewMode === 'proportional' && sectorAngles) {
//         // Fixed proportional positioning that maintains hierarchical structure
//         const pointsBySector = {};
//         transformedPoints.forEach((point, index) => {
//             const sectorIndex = calculateSectorIndex(point, ringIndex, true);
//             if (!pointsBySector[sectorIndex]) {
//                 pointsBySector[sectorIndex] = [];
//             }
//             pointsBySector[sectorIndex].push({ point: points[index], transformedPoint: point, index });
//         });

//         let currentAngle = rotationOffset;
//         const startAngles = sectorAngles.map((angle) => {
//             const start = currentAngle;
//             currentAngle += angle;
//             return start;
//         });

//         // Debug logging for proportional positioning
//         console.log(`Proportional positioning for ring ${ringIndex}:`, {
//             sectors: sectorAngles.length,
//             sectorAngles: sectorAngles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
//             startAngles: startAngles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
//             pointsBySector: Object.keys(pointsBySector).map(k => ({ sector: k, count: pointsBySector[k].length })),
//             showEmptySectors
//         });

//         Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
//             const sectorIdx = parseInt(sectorIndex);
//             const sectorAngle = sectorAngles[sectorIdx];

//             // Skip sectors with zero angle when not showing empty sectors
//             if (!showEmptySectors && sectorAngle === 0) {
//                 console.log(`Skipping sector ${sectorIdx} (zero angle)`);
//                 return;
//             }

//             // Skip sectors with very small angles (less than 0.01 radians ≈ 0.6°)
//             if (sectorAngle < 0.01) {
//                 console.log(`Skipping sector ${sectorIdx} (very small angle: ${(sectorAngle * 180 / Math.PI).toFixed(2)}°)`);
//                 return;
//             }

//             const startAngle = startAngles[sectorIdx];
//             const centerAngle = startAngle + (sectorAngle / 2);

//             console.log(`Positioning ${sectorPoints.length} points in sector ${sectorIdx}, angle: ${(sectorAngle * 180 / Math.PI).toFixed(2)}°, center: ${(centerAngle * 180 / Math.PI).toFixed(2)}°`);

//             sectorPoints.forEach(({ point, transformedPoint, index }, i) => {
//                 const clusterFactor = 0.9;
//                 const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * i) / Math.max(1, sectorPoints.length);

//                 const x = radius * Math.cos(centerAngle);
//                 const y = radius * Math.sin(centerAngle);

//                 positions.push({
//                     point,
//                     transformedPoint,
//                     x,
//                     y,
//                     sectorIndex: sectorIdx,
//                     angle: centerAngle
//                 });
//             });
//         });
//     }

//     return positions;
// };

// // Validation function to check hierarchical structure integrity
// export const validateHierarchicalStructure = (sectorAngles, sectorCounts, showEmptySectors = true) => {
//     const issues = [];

//     for (let ringIndex = 0; ringIndex < sectorAngles.length - 1; ringIndex++) {
//         const innerAngles = sectorAngles[ringIndex];
//         const outerAngles = sectorAngles[ringIndex + 1];

//         const innerTotal = innerAngles.reduce((sum, angle) => sum + angle, 0);
//         const outerTotal = outerAngles.reduce((sum, angle) => sum + angle, 0);

//         const tolerance = 0.1; // Allow small differences due to floating point
//         if (Math.abs(innerTotal - outerTotal) > tolerance) {
//             issues.push({
//                 type: 'angle_mismatch',
//                 ringIndex,
//                 innerTotal: innerTotal * 180 / Math.PI,
//                 outerTotal: outerTotal * 180 / Math.PI,
//                 difference: Math.abs(innerTotal - outerTotal) * 180 / Math.PI
//             });
//         }

//         // Check for orphaned sectors (inner sectors with no outer parent)
//         const ratio = outerAngles.length / innerAngles.length;
//         for (let i = 0; i < innerAngles.length; i++) {
//             if (innerAngles[i] > 0) {
//                 let hasActiveParent = false;
//                 for (let j = 0; j < ratio && (i * ratio + j) < outerAngles.length; j++) {
//                     const outerIdx = Math.floor(i * ratio + j);
//                     if (outerAngles[outerIdx] > 0) {
//                         hasActiveParent = true;
//                         break;
//                     }
//                 }

//                 if (!hasActiveParent && !showEmptySectors) {
//                     issues.push({
//                         type: 'orphaned_sector',
//                         ringIndex,
//                         sectorIndex: i,
//                         angle: innerAngles[i] * 180 / Math.PI
//                     });
//                 }
//             }
//         }
//     }

//     if (issues.length > 0) {
//         console.warn('Hierarchical structure validation issues:', issues);
//     } else {
//         console.log('Hierarchical structure validation passed');
//     }

//     return issues;
// };

// // Export all transformation functions for backward compatibility
// export {
//     transformPositiveNegative,
//     transformZScore,
//     transformPercentile,
//     transformCustomThreshold,
//     transformRadial,

// };


import * as d3 from "d3";

// Import transformation strategies
import { transformPositiveNegative } from './options/PosNeg.js';
import { transformZScore } from './options/zScore.js';
import { transformPercentile } from './options/Percentile.js';
import { transformCustomThreshold } from './options/CustomThreshold.js';
import { transformRadial } from './options/Radial.js';
import { transformDecisionTree } from "./options/DecisionTree.js";

// Coordinate transformation constants
export const CoordinateTransforms = {
    POSITIVE_NEGATIVE: 'positive_negative',
    Z_SCORE: 'z_score',
    PERCENTILE: 'percentile',
    CUSTOM_THRESHOLD: 'custom_threshold',
    RADIAL: 'radial',
    DECISION_TREE: 'decision_tree'
};

// Main coordinate transformation function
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
        // For decision trees, look for tree-specific binary fields
        coordinates = Object.entries(point).filter(([key]) => {
            if (useTransformed) {
                return key.endsWith('_binary') || key.endsWith('_decision') || key.endsWith('_split');
            }
            return key !== "Point_ID" && !key.endsWith('_binary') && !key.endsWith('_decision') && !key.endsWith('_split');
        });
    } else {
        // Original logic for other strategies
        coordinates = Object.entries(point).filter(([key]) => {
            if (useTransformed) {
                return key.endsWith('_binary');
            }
            return key !== "Point_ID" && !key.endsWith('_binary');
        });
    }

    if (coordinates.length === 0) {
        console.warn(`No coordinates found for point ${point.Point_ID} with strategy ${strategy}, useTransformed: ${useTransformed}`);
        // Fallback: use all numeric fields except Point_ID
        coordinates = Object.entries(point).filter(([key, value]) =>
            key !== "Point_ID" && typeof value === 'number'
        );
    }

    let bitVector;
    if (useTransformed && strategy === CoordinateTransforms.DECISION_TREE) {
        // For decision trees, the transformed values should already be binary
        bitVector = coordinates.map(([_, value]) => {
            if (typeof value === 'boolean') return value ? '1' : '0';
            if (typeof value === 'number') return value >= 0.5 ? '1' : '0';
            return String(value);
        }).join("");
    } else if (useTransformed) {
        bitVector = coordinates.map(([_, value]) => String(value)).join("");
    } else {
        bitVector = coordinates.map(([_, value]) => (value >= 0 ? '1' : '0')).join("");
    }

    console.log(`Point ${point.Point_ID}, Strategy: ${strategy}, Bit Vector: ${bitVector}, Coordinates: ${coordinates.length}`);
    return bitVector;
};

// Enhanced sector index calculation with decision tree support
export const calculateSectorIndex = (point, ringIndex, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
    const bitVector = generateBitVector(point, useTransformed, strategy);

    if (bitVector.length === 0) {
        console.warn(`Empty bit vector for point ${point.Point_ID}, returning sector 0`);
        return 0;
    }

    const sectors = 2 ** (ringIndex + 1);
    let sectorIndex;

    if (strategy === CoordinateTransforms.DECISION_TREE) {
        // For decision trees, we might need special handling
        // Check if the point has a pre-calculated sector index
        if (point.sectorIndex !== undefined) {
            sectorIndex = Math.min(point.sectorIndex, sectors - 1);
        } else {
            // Use the bit vector but ensure it fits within the expected sectors
            const binaryValue = parseInt(bitVector.substring(0, ringIndex + 1), 2) || 0;
            sectorIndex = Math.min(binaryValue, sectors - 1);
        }
    } else {
        // Original logic for other strategies
        const binaryValue = parseInt(bitVector, 2) || 0;
        sectorIndex = Math.min(binaryValue, sectors - 1);
    }

    console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Strategy: ${strategy}, Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
    return sectorIndex;
};

// Enhanced sector point counts calculation with decision tree support
export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {
    if (transformStrategy === CoordinateTransforms.RADIAL) {
        return pointsData.map(ringData => [ringData.points.length]);
    }

    return pointsData.map((ringData, index) => {
        try {
            const transformedPoints = transformCoordinates(ringData.points, transformStrategy, transformOptions);
            const sectors = 2 ** (index + 1);
            const counts = Array(sectors).fill(0);

            transformedPoints.forEach(point => {
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

// Helper function to get active sector mapping for point positioning
export const getActiveSectorMapping = (sectorCounts, showEmptySectors = true) => {
    const activeMaps = [];

    sectorCounts.forEach((counts, ringIndex) => {
        if (showEmptySectors) {
            // All sectors are "active" when showing empty ones
            activeMaps[ringIndex] = Array.from({ length: counts.length }, (_, i) => i);
        } else {
            // Only non-empty sectors are active
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

    // Track which sectors are active (non-empty) for hierarchical mapping
    const activeSectorMaps = [];

    for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
        const currentCounts = sectorCounts[ringIndex];
        const sectors = currentCounts.length;

        // Handle single sector case (radial transform)
        if (sectors === 1) {
            sectorAngles[ringIndex] = [359 * Math.PI / 180];
            activeSectorMaps[ringIndex] = [0]; // Single active sector
            continue;
        }

        const totalPoints = currentCounts.reduce((sum, count) => sum + count, 0) || 1;
        const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

        if (ringIndex === lastRingIndex) {
            // Outermost ring - calculate angles based on point counts
            if (showEmptySectors) {
                // Show all sectors with minimum angle for empty ones
                const emptySectors = currentCounts.filter(count => count === 0).length;
                const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

                const angles = currentCounts.map(count => {
                    return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
                });

                sectorAngles[ringIndex] = angles;
                activeSectorMaps[ringIndex] = Array.from({ length: sectors }, (_, i) => i);
            } else {
                // Only show non-empty sectors
                const activeSectors = [];
                const activeAngles = [];

                currentCounts.forEach((count, index) => {
                    if (count > 0) {
                        activeSectors.push(index);
                        activeAngles.push((count / totalPoints) * 2 * Math.PI);
                    }
                });

                // Create full angle array with zeros for empty sectors
                const angles = Array(sectors).fill(0);
                activeSectors.forEach((sectorIndex, i) => {
                    angles[sectorIndex] = activeAngles[i];
                });

                sectorAngles[ringIndex] = angles;
                activeSectorMaps[ringIndex] = activeSectors;
            }
        } else {
            // Inner rings - maintain hierarchical relationship
            const outerAngles = sectorAngles[ringIndex + 1];
            const outerActiveSectors = activeSectorMaps[ringIndex + 1];
            const innerSectors = sectors;
            const outerSectors = outerAngles.length;

            if (outerSectors === 0 || outerActiveSectors.length === 0) {
                // Fallback if no outer sectors
                const uniformAngle = 2 * Math.PI / innerSectors;
                sectorAngles[ringIndex] = Array(innerSectors).fill(uniformAngle);
                activeSectorMaps[ringIndex] = Array.from({ length: innerSectors }, (_, i) => i);
                continue;
            }

            // Calculate hierarchical mapping
            const ratio = outerSectors / innerSectors;
            const angles = Array(innerSectors).fill(0);
            const activeSectors = [];

            for (let i = 0; i < innerSectors; i++) {
                let sumAngle = 0;
                let hasActiveChild = false;

                // Sum angles from corresponding outer sectors
                for (let j = 0; j < ratio && (i * ratio + j) < outerSectors; j++) {
                    const outerIdx = Math.floor(i * ratio + j);
                    const outerAngle = outerAngles[outerIdx] || 0;
                    sumAngle += outerAngle;

                    // Check if this outer sector is active
                    if (outerActiveSectors.includes(outerIdx) && outerAngle > 0) {
                        hasActiveChild = true;
                    }
                }

                // Only include this inner sector if it has active children or we're showing empty sectors
                if (showEmptySectors || hasActiveChild || currentCounts[i] > 0) {
                    angles[i] = sumAngle || (2 * Math.PI / innerSectors);
                    if (hasActiveChild || currentCounts[i] > 0) {
                        activeSectors.push(i);
                    }
                } else {
                    angles[i] = 0; // No angle for inactive sectors when not showing empty
                }
            }

            sectorAngles[ringIndex] = angles;
            activeSectorMaps[ringIndex] = activeSectors;
        }
    }

    // Debug logging
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

// Ring structure generation
export const generateRingStructure = (jsonData, transformStrategy = null, transformOptions = {}, labelsData = null) => {
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
    const ringColorScale = d3.scaleSequential(d3.interpolatePlasma).domain([ringCount, 0]);

    const getRingColor = (index) => d3.color(ringColorScale(index));

    const getSectorColor = (ringIndex, sectorIndex) => {
        const baseColor = d3.hsl(getRingColor(ringIndex));
        const isPositive = sectorIndex % 2 === 0;
        return d3.hsl(baseColor.h, baseColor.s, isPositive ? 0.75 : 0.35).toString();
    };

    return { getRingColor, getSectorColor };
};

// Enhanced point positions calculation with decision tree support
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
        const transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
        const rotationOffset = 0; // 0° at 3 o'clock
        const positions = [];

        if (transformStrategy === CoordinateTransforms.RADIAL) {
            console.log(`Calculating positions for ring ${ringIndex}, points: ${points.length}, innerRadius: ${innerRadius}, outerRadius: ${outerRadius}`);

            // Set default radii for the innermost circle (ringIndex === 0)
            const effectiveInnerRadius = ringIndex === 0 ? 20 : innerRadius;
            const effectiveOuterRadius = ringIndex === 0 ? 60 : outerRadius;

            // Calculate the central radius of the ring
            const centralRadius = (effectiveInnerRadius + effectiveOuterRadius) / 2;

            // Group points by angle to detect coinciding points
            const angleGroups = {};
            transformedPoints.forEach((point, pointIndex) => {
                const angle = point.angle !== undefined ? point.angle + rotationOffset : rotationOffset;
                const angleKey = angle.toFixed(8);
                if (!angleGroups[angleKey]) {
                    angleGroups[angleKey] = [];
                }
                angleGroups[angleKey].push({ point, pointIndex, angle });
            });

            // Process each group of points
            Object.values(angleGroups).forEach(group => {
                const numCoinciding = group.length;
                group.forEach(({ point, pointIndex, angle }, index) => {
                    const originalPoint = points[pointIndex];

                    // For coinciding points, offset radius slightly
                    let radius = centralRadius;
                    if (numCoinciding > 1) {
                        const offsetStep = 3;
                        const offset = ((index - (numCoinciding - 1) / 2) * offsetStep);
                        radius += offset;
                    }

                    // Ensure radius stays within bounds
                    radius = Math.max(effectiveInnerRadius, Math.min(effectiveOuterRadius, radius));

                    const x = radius * Math.cos(angle);
                    const y = radius * Math.sin(angle);

                    if (isNaN(x) || isNaN(y)) {
                        console.warn(`Invalid position for point ${point.Point_ID}: radius=${radius}, angle=${(angle * 180 / Math.PI).toFixed(2)}°, x=${x}, y=${y}`);
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

                    console.log(`Point ${point.Point_ID} at ring ${ringIndex}: angle=${(angle * 180 / Math.PI).toFixed(2)}°, x=${x.toFixed(2)}, y=${y.toFixed(2)}, radius=${radius.toFixed(2)}`);
                });
            });
        }
        else if (viewMode === 'normal') {
            const sectorCounts = Array(sectors).fill(0);
            transformedPoints.forEach(point => {
                try {
                    const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
                    if (sectorIndex >= 0 && sectorIndex < sectors) {
                        sectorCounts[sectorIndex]++;
                    }
                } catch (error) {
                    console.error(`Error calculating sector for point ${point.Point_ID}:`, error);
                }
            });

            const sectorsToRender = showEmptySectors ?
                Array.from({ length: sectors }, (_, i) => i) :
                Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

            const anglePerSector = 2 * Math.PI / (showEmptySectors ? sectors : sectorsToRender.length);

            transformedPoints.forEach((point, pointIndex) => {
                try {
                    const originalPoint = points[pointIndex];
                    const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);

                    let displayIndex = sectorIndex;
                    if (!showEmptySectors) {
                        displayIndex = sectorsToRender.indexOf(sectorIndex);
                        if (displayIndex === -1) return;
                    }

                    const startAngle = (anglePerSector * displayIndex) + rotationOffset;
                    const centerAngle = startAngle + (anglePerSector / 2);

                    const clusterFactor = 0.9;
                    const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * (pointIndex % points.length)) / points.length;

                    const x = radius * Math.cos(centerAngle);
                    const y = radius * Math.sin(centerAngle);

                    positions.push({
                        point: originalPoint,
                        transformedPoint: point,
                        x,
                        y,
                        sectorIndex,
                        angle: centerAngle
                    });
                } catch (error) {
                    console.error(`Error positioning point ${point.Point_ID}:`, error);
                }
            });
        } else if (viewMode === 'proportional' && sectorAngles) {
            // Fixed proportional positioning that maintains hierarchical structure
            const pointsBySector = {};
            transformedPoints.forEach((point, index) => {
                try {
                    const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
                    if (!pointsBySector[sectorIndex]) {
                        pointsBySector[sectorIndex] = [];
                    }
                    pointsBySector[sectorIndex].push({ point: points[index], transformedPoint: point, index });
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

            // Debug logging for proportional positioning
            console.log(`Proportional positioning for ring ${ringIndex}:`, {
                sectors: sectorAngles.length,
                sectorAngles: sectorAngles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
                startAngles: startAngles.map(a => (a * 180 / Math.PI).toFixed(2) + '°'),
                pointsBySector: Object.keys(pointsBySector).map(k => ({ sector: k, count: pointsBySector[k].length })),
                showEmptySectors
            });

            Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
                const sectorIdx = parseInt(sectorIndex);
                const sectorAngle = sectorAngles[sectorIdx];

                // Skip sectors with zero angle when not showing empty sectors
                if (!showEmptySectors && sectorAngle === 0) {
                    console.log(`Skipping sector ${sectorIdx} (zero angle)`);
                    return;
                }

                // Skip sectors with very small angles (less than 0.01 radians ≈ 0.6°)
                if (sectorAngle < 0.01) {
                    console.log(`Skipping sector ${sectorIdx} (very small angle: ${(sectorAngle * 180 / Math.PI).toFixed(2)}°)`);
                    return;
                }

                const startAngle = startAngles[sectorIdx];
                const centerAngle = startAngle + (sectorAngle / 2);

                console.log(`Positioning ${sectorPoints.length} points in sector ${sectorIdx}, angle: ${(sectorAngle * 180 / Math.PI).toFixed(2)}°, center: ${(centerAngle * 180 / Math.PI).toFixed(2)}°`);

                sectorPoints.forEach(({ point, transformedPoint, index }, i) => {
                    const clusterFactor = 0.9;
                    const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * i) / Math.max(1, sectorPoints.length);

                    const x = radius * Math.cos(centerAngle);
                    const y = radius * Math.sin(centerAngle);

                    positions.push({
                        point,
                        transformedPoint,
                        x,
                        y,
                        sectorIndex: sectorIdx,
                        angle: centerAngle
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

// Validation function to check hierarchical structure integrity
export const validateHierarchicalStructure = (sectorAngles, sectorCounts, showEmptySectors = true) => {
    const issues = [];

    for (let ringIndex = 0; ringIndex < sectorAngles.length - 1; ringIndex++) {
        const innerAngles = sectorAngles[ringIndex];
        const outerAngles = sectorAngles[ringIndex + 1];

        const innerTotal = innerAngles.reduce((sum, angle) => sum + angle, 0);
        const outerTotal = outerAngles.reduce((sum, angle) => sum + angle, 0);

        const tolerance = 0.1; // Allow small differences due to floating point
        if (Math.abs(innerTotal - outerTotal) > tolerance) {
            issues.push({
                type: 'angle_mismatch',
                ringIndex,
                innerTotal: innerTotal * 180 / Math.PI,
                outerTotal: outerTotal * 180 / Math.PI,
                difference: Math.abs(innerTotal - outerTotal) * 180 / Math.PI
            });
        }

        // Check for orphaned sectors (inner sectors with no outer parent)
        const ratio = outerAngles.length / innerAngles.length;
        for (let i = 0; i < innerAngles.length; i++) {
            if (innerAngles[i] > 0) {
                let hasActiveParent = false;
                for (let j = 0; j < ratio && (i * ratio + j) < outerAngles.length; j++) {
                    const outerIdx = Math.floor(i * ratio + j);
                    if (outerAngles[outerIdx] > 0) {
                        hasActiveParent = true;
                        break;
                    }
                }

                if (!hasActiveParent && !showEmptySectors) {
                    issues.push({
                        type: 'orphaned_sector',
                        ringIndex,
                        sectorIndex: i,
                        angle: innerAngles[i] * 180 / Math.PI
                    });
                }
            }
        }
    }

    if (issues.length > 0) {
        console.warn('Hierarchical structure validation issues:', issues);
    } else {
        console.log('Hierarchical structure validation passed');
    }

    return issues;
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