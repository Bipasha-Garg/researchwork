

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
                const result = transformDecisionTree(points, options);
                return result.transformedPoints;
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

// Enhanced sector index calculation with decision tree support
export const calculateSectorIndex = (point, ringIndex, useTransformed = true, strategy = CoordinateTransforms.POSITIVE_NEGATIVE) => {
    if (strategy === CoordinateTransforms.DECISION_TREE) {
        if (point.nodeAssignments && point.nodeAssignments[ringIndex]) {
            const assignment = point.nodeAssignments[ringIndex];
            return assignment.nodeId % (2 ** (ringIndex + 1));
        }
        const sectors = 2 ** (ringIndex + 1);
        const pointId = Array.isArray(point.Point_ID) ? point.Point_ID[0] : point.Point_ID;
        return (point.Point_ID || 0) % sectors;
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

// Enhanced sector point counts calculation with decision tree support
export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {
    if (transformStrategy === CoordinateTransforms.RADIAL) {
        return pointsData.map(ringData => [ringData.points.length]);
    }

    return pointsData.map((ringData, index) => {
        try {
            let pointsToCount = ringData.points;

            // For decision tree, points are already transformed in the ring structure
            if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
                // Points are already assigned to correct rings with nodeAssignments
                pointsToCount = ringData.points;
            } else {
                pointsToCount = transformCoordinates(ringData.points, transformStrategy, transformOptions);
            }

            const sectors = 2 ** (index + 1);
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
    if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
        console.log("=== GENERATING DECISION TREE RING STRUCTURE ===");
        const allPoints = Object.values(jsonData).flat();
        console.log(`Processing ${allPoints.length} points for decision tree`);
        const result = transformDecisionTree(allPoints, { ...transformOptions, labelsData });
        const { tree, transformedPoints } = result;
        const rings = [];
        for (let depth = 0; depth < tree.levels.length; depth++) {
            const nodesAtDepth = tree.levels[depth];
            const sectors = nodesAtDepth.length;
            const pointsInRing = [];
            nodesAtDepth.forEach((node, sectorIndex) => {
                const pointsInSector = transformedPoints.filter(p => {
                    if (!p.nodeAssignments || !p.nodeAssignments[depth]) return false;
                    return p.nodeAssignments[depth].nodeId === node.nodeId;
                });
                pointsInSector.forEach(pt => {
                    pt.sectorIndex = sectorIndex;
                    if (!pt.nodeAssignments[depth]) {
                        pt.nodeAssignments[depth] = { nodeId: node.nodeId, depth: depth };
                    }
                });
                pointsInRing.push(...pointsInSector);
            });
            rings.push({
                key: `TreeDepth${depth + 1}`,
                points: pointsInRing,
                dimensions: depth + 1,
                subspaceId: `TreeDepth${depth + 1}`,
                ringIndex: depth,
                sectors
            });
        }
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
        let transformedPoints = points;
        if (transformStrategy !== CoordinateTransforms.DECISION_TREE) {
            transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
        }

        const rotationOffset = 0;
        const positions = [];

        if (transformStrategy === CoordinateTransforms.RADIAL) {
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
        }
        else if (viewMode === 'normal') {
            const sectorCounts = Array(sectors).fill(0);
            const pointsBySector = {};

            transformedPoints.forEach((point, pointIndex) => {
                try {
                    const sectorIndex = calculateSectorIndex(point, ringIndex, true, transformStrategy);
                    if (sectorIndex >= 0 && sectorIndex < sectors) {
                        sectorCounts[sectorIndex]++;
                        if (!pointsBySector[sectorIndex]) {
                            pointsBySector[sectorIndex] = [];
                        }
                        pointsBySector[sectorIndex].push({
                            point: points[pointIndex],
                            transformedPoint: point,
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
                const centerAngle = startAngle + (anglePerSector / 2);

                sectorPoints.forEach(({ point, transformedPoint }, pointIndex) => {
                    const clusterFactor = 0.9;
                    const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * pointIndex) / Math.max(1, sectorPoints.length);

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
        } else if (viewMode === 'proportional' && sectorAngles) {
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
                const centerAngle = startAngle + (sectorAngle / 2);

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

// Export all transformation functions for backward compatibility
export {
    transformPositiveNegative,
    transformZScore,
    transformPercentile,
    transformCustomThreshold,
    transformRadial,
    transformDecisionTree
};
