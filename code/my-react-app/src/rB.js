// ModularB.js
import * as d3 from "d3";

// Import transformation strategies (Assume these exist as in your original setup)
import { transformPositiveNegative } from './options/PosNeg.js';
import { transformZScore } from './options/zScore.js';
import { transformPercentile } from './options/Percentile.js';
import { transformCustomThreshold } from './options/CustomThreshold.js';
import { transformRadial } from './options/Radial.js';
// Import NEW Decision Tree strategy
import { DecisionTree, transformDecisionTree } from "./options/DecisionTree.js";

// Coordinate transformation constants
export const CoordinateTransforms = {
    POSITIVE_NEGATIVE: 'positive_negative',
    Z_SCORE: 'z_score',
    PERCENTILE: 'percentile',
    CUSTOM_THRESHOLD: 'custom_threshold',
    RADIAL: 'radial',
    DECISION_TREE: 'decision_tree' // ADDED
};

// Main coordinate transformation function
export const transformCoordinates = (points, strategy, options = {}) => {
    // NEW: Handle Decision Tree separately
    if (strategy === CoordinateTransforms.DECISION_TREE) {
        // options should include labelsData, maxDepth, minSamplesLeaf, minSamplesSplit
        return transformDecisionTree(points, options);
    }
    // EXISTING logic for other strategies
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
        default: // Fallback to original default
            return transformPositiveNegative(points);
    }
};

// Bit vector generation - UNCHANGED from your original
export const generateBitVector = (point, useTransformed = true) => {
    const coordinates = Object.entries(point).filter(([key]) => {
        if (useTransformed) {
            return key.endsWith('_binary');
        }
        return key !== "Point_ID" && !key.endsWith('_binary') && typeof point[key] === 'number';
    });

    if (useTransformed) {
        const bitVector = coordinates.map(([_, value]) => value).join("");
        // console.log(`Point ${point.Point_ID}, Bit Vector: ${bitVector}`);
        return bitVector;
    } else {
        const bitVector = coordinates.map(([_, value]) => (value >= 0 ? 1 : 0)).join("");
        // console.log(`Point ${point.Point_ID}, Bit Vector (untransformed): ${bitVector}`);
        return bitVector;
    }
};

// Sector index calculation - UNCHANGED from your original
export const calculateSectorIndex = (point, ringIndex, useTransformed = true) => {
    const bitVector = generateBitVector(point, useTransformed);
    if (!bitVector) return 0;
    const sectors = 2 ** (ringIndex + 1); // Original logic
    const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);
    // console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
    return sectorIndex;
};

// Sector point counts calculation
export const calculateSectorPointCounts = (ringStructureData, transformStrategy, transformOptions = {}, labelsData = null) => {
    // NEW: Handle Decision Tree
    if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
        // ringStructureData contains DT levels; each 'ring' (level) has 'points' (nodes)
        return ringStructureData.map(ringLevel => {
            if (ringLevel.isTreeLevel && Array.isArray(ringLevel.points)) {
                return ringLevel.points.map(node => node.samples || 0); // Use node.samples for count
            }
            return []; // Should not happen with correct DT structure
        });
    }

    // EXISTING logic for Radial
    if (transformStrategy === CoordinateTransforms.RADIAL) {
        return ringStructureData.map(ringData => [ringData.points ? ringData.points.length : 0]);
    }

    // EXISTING logic for other strategies (taken from your original ModularB)
    return ringStructureData.map((ringData, index) => {
        const pointsForTransform = ringData.points || [];
        // The original transformCoordinates in your code was directly transforming raw points
        // Here, we ensure that for non-DT, non-Radial, the transformation happens correctly.
        const transformedPoints = transformCoordinates(pointsForTransform, transformStrategy, transformOptions);

        const sectors = ringData.sectors || (2 ** (index + 1)); // Use sectors from ringData or default
        const counts = Array(sectors).fill(0);

        transformedPoints.forEach(point => {
            // For non-DT, ringIndex IS the 'index' argument here.
            const sectorIndex = calculateSectorIndex(point, index, true);
            if (sectorIndex >= 0 && sectorIndex < sectors) {
                counts[sectorIndex]++;
            }
        });
        return counts;
    });
};

// Helper function to get active sector mapping - UNCHANGED from your original
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


// Proportional sector angles calculation
export const calculateProportionalSectorAngles = (sectorCounts, showEmptySectors = true, ringStructureForDT = null, currentTransformStrategy = null) => {
    // NEW: Handle Decision Tree
    if (currentTransformStrategy === CoordinateTransforms.DECISION_TREE && ringStructureForDT) {
        // For DT, angles are pre-calculated on nodes.
        // ringStructureForDT is the array of levels; each level (ring) has 'points' (nodes).
        return ringStructureForDT.map(level => {
            if (level.isTreeLevel && Array.isArray(level.points)) {
                return level.points.map(node => node.angle || 0); // node.angle is the angular span
            }
            return [];
        });
    }

    // EXISTING logic from your original ModularB (for non-DT cases)
    const sectorAngles = [];
    const lastRingIndex = sectorCounts.length - 1;
    const activeSectorMaps = getActiveSectorMapping(sectorCounts, showEmptySectors); // Use existing helper

    for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
        const currentCounts = sectorCounts[ringIndex];
        if (!currentCounts || currentCounts.length === 0) {
            sectorAngles[ringIndex] = [];
            continue;
        }
        const sectors = currentCounts.length;

        // Handle single sector case (e.g., for RADIAL in original)
        if (sectors === 1 && currentTransformStrategy === CoordinateTransforms.RADIAL) { // Check strategy if it was radial
            sectorAngles[ringIndex] = [(359 * Math.PI / 180)];
            continue;
        }
        if (sectors === 0) {
            sectorAngles[ringIndex] = [];
            continue;
        }

        const totalPoints = currentCounts.reduce((sum, count) => sum + count, 0) || 1;
        // Original minAngle logic (adjust if needed, this is from your provided snippet)
        const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;


        if (ringIndex === lastRingIndex || !activeSectorMaps[ringIndex + 1] || activeSectorMaps[ringIndex + 1].length === 0) {
            // Outermost ring or if parent has no active sectors (or doesn't exist)
            if (showEmptySectors) {
                const emptySectorsCount = currentCounts.filter(count => count === 0).length;
                // Original logic for remainingAngle. Ensure it's not negative.
                const remainingAngle = Math.max(0, 2 * Math.PI - (minAngle * emptySectorsCount));
                const angles = currentCounts.map(count => {
                    return count === 0 ? minAngle : Math.max(minAngle, (count / totalPoints) * remainingAngle);
                });
                // Normalize if sum slightly off
                const sumAngles = angles.reduce((s, a) => s + a, 0);
                sectorAngles[ringIndex] = sumAngles > 0.001 ? angles.map(a => a * (2 * Math.PI / sumAngles)) : Array(sectors).fill((2 * Math.PI) / sectors);


            } else { // Hide empty sectors (original logic)
                const activeSectorsIdx = activeSectorMaps[ringIndex]; // Get active indices for this ring
                const angles = Array(sectors).fill(0);
                activeSectorsIdx.forEach(sectorIdx => {
                    angles[sectorIdx] = (currentCounts[sectorIdx] / totalPoints) * 2 * Math.PI;
                });
                sectorAngles[ringIndex] = angles;
            }
        } else {
            // Inner rings - maintain hierarchical relationship (original logic)
            const outerAngles = sectorAngles[ringIndex + 1];
            const outerActiveSectorsMap = activeSectorMaps[ringIndex + 1]; // Get active indices for outer ring
            const innerSectorsCount = sectors;
            const outerSectorsCount = outerAngles.length;

            if (outerSectorsCount === 0 || (outerActiveSectorsMap.length === 0 && !showEmptySectors)) {
                const uniformAngle = 2 * Math.PI / innerSectorsCount;
                sectorAngles[ringIndex] = Array(innerSectorsCount).fill(uniformAngle);
                continue;
            }

            const ratio = outerSectorsCount / innerSectorsCount;
            const angles = Array(innerSectorsCount).fill(0);

            for (let i = 0; i < innerSectorsCount; i++) {
                let sumAngle = 0;
                let hasActiveChild = false;
                for (let j = 0; j < ratio && (i * ratio + j) < outerSectorsCount; j++) {
                    const outerIdx = Math.floor(i * ratio + j);
                    const outerAngle = outerAngles[outerIdx] || 0;
                    sumAngle += outerAngle;
                    if (outerActiveSectorsMap.includes(outerIdx) && outerAngle > 0.0001) { // Check if parent sector is active and has angle
                        hasActiveChild = true;
                    }
                }

                if (showEmptySectors || hasActiveChild || currentCounts[i] > 0) {
                    // If sumAngle is tiny but should be shown, give it at least minAngle proportion
                    angles[i] = sumAngle > minAngle ? sumAngle : ((showEmptySectors || hasActiveChild || currentCounts[i] > 0) ? minAngle * innerSectorsCount : 0);
                } else {
                    angles[i] = 0;
                }
            }
            // Normalize angles for the current ring
            const currentTotalAngle = angles.reduce((s, a) => s + a, 0);
            if (currentTotalAngle > 0.001) {
                sectorAngles[ringIndex] = angles.map(a => a * (2 * Math.PI / currentTotalAngle));
            } else if (showEmptySectors && innerSectorsCount > 0) {
                sectorAngles[ringIndex] = Array(innerSectorsCount).fill(2 * Math.PI / innerSectorsCount);
            } else {
                sectorAngles[ringIndex] = angles; // all zeros
            }
        }
    }
    return sectorAngles;
};


// Ring structure generation
export const generateRingStructure = (sourceData, transformStrategy = null, transformOptions = {}, labelsData = null) => {
    // NEW: Handle Decision Tree
    if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
        // sourceData is expected to be treeStructure.levels from the DT transformation
        const treeLevels = sourceData;
        if (!Array.isArray(treeLevels)) {
            console.error("DT: generateRingStructure expected tree.levels array for sourceData.");
            return [];
        }
        return treeLevels.map((levelNodes, index) => ({
            key: `TreeLevel_${index}`, // Unique key for the ring/level
            points: levelNodes,    // Array of DecisionTreeNode objects for this level
            dimensions: levelNodes.length > 0 && levelNodes[0].feature ? 2 : 1, // Arbitrary, e.g., # features or node count
            subspaceId: `TreeLevel_${index}`, // For compatibility if any part of original code uses subspaceId
            ringIndex: index,
            sectors: levelNodes.length, // Number of nodes in this level determines its 'sectors'
            isTreeLevel: true          // Flag to identify these as DT levels
        }));
    }

    // EXISTING logic from your original ModularB (for non-DT cases)
    const subspaces = Object.keys(sourceData);
    subspaces.sort((a, b) => a.length - b.length); // Original sorting

    return subspaces.map((key, index) => ({
        key,
        points: sourceData[key] || [],
        dimensions: key.length,
        subspaceId: key,
        ringIndex: index,
        sectors: transformStrategy === CoordinateTransforms.RADIAL ? 1 : 2 ** (index + 1), // Original sector calculation
        isTreeLevel: false // Flag for non-DT rings
    }));
};


// Color scheme generation - UNCHANGED from your original
export const generateColorSchemes = (ringCount) => {
    const ringColorScale = d3.scaleSequential(d3.interpolatePlasma).domain([ringCount, 0]);
    const getRingColor = (index) => d3.color(ringColorScale(index));
    const getSectorColor = (ringIndex, sectorIndex) => {
        const baseColor = d3.hsl(getRingColor(ringIndex));
        const isPositive = sectorIndex % 2 === 0; // Original logic
        return d3.hsl(baseColor.h, baseColor.s, isPositive ? 0.75 : 0.35).toString();
    };
    return { getRingColor, getSectorColor };
};


// Point positions calculation
export const calculatePointPositions = (
    dataPointsToPlace, // For DT: all data points. For others: points of the current ring.
    ringIndex,
    innerRadius,
    outerRadius,
    sectorsCountInRing, // For DT: number of nodes. For others: from ring.sectors
    sectorAngleSpans = null, // Proportional angles, or DT node angles
    viewMode = 'normal',
    showEmptySectors = true,
    transformStrategy = CoordinateTransforms.POSITIVE_NEGATIVE,
    transformOptions = {},
    currentRingObject = null, // The ring object from ringStructure (has nodes for DT)
    svgGlobalRotationOffset = 0 // NEW PARAMETER for consistent rotation
) => {
    const positions = [];

    // NEW: Handle Decision Tree point placement
    if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
        if (!currentRingObject || !currentRingObject.isTreeLevel || !Array.isArray(currentRingObject.points)) {
            console.error("DT PointPos: Invalid currentRingObject or it's not a DT level.");
            return [];
        }
        const nodesInThisLevel = currentRingObject.points;

        dataPointsToPlace.forEach(originalDataPoint => { // Iterate over ALL data points
            // Find which node this dataPt belongs to AT THIS ringIndex (tree depth)
            const assignmentForThisLevel = originalDataPoint.nodeAssignments && originalDataPoint.nodeAssignments.find(na => na.depth === ringIndex);

            if (assignmentForThisLevel) {
                const targetNode = nodesInThisLevel.find(node => node.nodeId === assignmentForThisLevel.nodeId);
                if (targetNode && targetNode.angle > 0.0001) { // Ensure node has a displayable angle
                    // targetNode.startAngle and targetNode.angle are 0-2PI relative to 3 o'clock
                    const nodeEffectiveStartAngle = targetNode.startAngle + svgGlobalRotationOffset;
                    const centerAngleOfNode = nodeEffectiveStartAngle + (targetNode.angle / 2);

                    // Simple radial placement within the node's angular wedge
                    const radiusPadding = 0.15; // 15% padding from ring edges
                    const randomRadius = innerRadius + (outerRadius - innerRadius) * (radiusPadding + Math.random() * (1 - 2 * radiusPadding));

                    // Jitter angle slightly within the node's segment, avoid edges
                    const angleJitterMaxRange = targetNode.angle * (1 - 2 * radiusPadding) * 0.5; // Max jitter half of padded segment
                    const angleJitter = (Math.random() - 0.5) * angleJitterMaxRange;

                    const finalPlotAngle = centerAngleOfNode + angleJitter;
                    const x = randomRadius * Math.cos(finalPlotAngle);
                    const y = randomRadius * Math.sin(finalPlotAngle);

                    positions.push({
                        point: originalDataPoint, // The original data point object
                        transformedPoint: originalDataPoint, // DT doesn't transform coords but adds .predicted_class, .nodeAssignments
                        x, y,
                        sectorIndex: targetNode.sectorIndex, // Index of the node within its level
                        angle: finalPlotAngle, // Actual plotted angle
                        nodeId: targetNode.nodeId // Store which DT node it belongs to
                    });
                }
            }
        });
        return positions; // Return early for DT
    }

    // EXISTING logic from your original ModularB (for non-DT cases)
    // The 'rotationOffset' in original code was 0 or Math.PI/2. We now use svgGlobalRotationOffset.
    // The 'points' in original code are `dataPointsToPlace` here.
    // `sectors` in original code is `sectorsCountInRing` here.
    // `sectorAngles` in original code is `sectorAngleSpans` here.
    // `ring` in original code is `currentRingObject` here.

    const transformedPoints = transformCoordinates(dataPointsToPlace, transformStrategy, transformOptions);
    // const originalRotationOffset = 0; // Your original code had rotationOffset = 0;
    // For RADIAL, your original code in HierarchicalGraph.jsx `renderRingSectors`
    // used Math.PI/2 for rotationOffset, this might conflict if not handled consistently.
    // Here we use the passed svgGlobalRotationOffset.

    if (transformStrategy === CoordinateTransforms.RADIAL) {
        // console.log(`RADIAL PointPos: ring ${ringIndex}, points: ${dataPointsToPlace.length}, innerR: ${innerRadius}, outerR: ${outerRadius}`);
        const effectiveInnerRadius = ringIndex === 0 ? Math.max(10, innerRadius) : innerRadius; // Min radius for innermost
        const effectiveOuterRadius = ringIndex === 0 ? Math.max(30, outerRadius) : outerRadius;

        const angleGroups = {}; // From original Radial logic in ModularB
        transformedPoints.forEach((point, pointIndex) => {
            const angle = point.angle !== undefined ? point.angle + svgGlobalRotationOffset : svgGlobalRotationOffset; // point.angle must be 0-2PI from transformRadial
            const angleKey = angle.toFixed(8);
            if (!angleGroups[angleKey]) angleGroups[angleKey] = [];
            angleGroups[angleKey].push({ point, originalPoint: dataPointsToPlace[pointIndex], angle });
        });

        Object.values(angleGroups).forEach(group => {
            const numCoinciding = group.length;
            group.forEach(({ point, originalPoint, angle }, indexInGroup) => {
                let radius = (effectiveInnerRadius + effectiveOuterRadius) / 2;
                if (numCoinciding > 1) {
                    const offsetStep = Math.min(3, (effectiveOuterRadius - effectiveInnerRadius) * 0.05);
                    const offset = (indexInGroup - (numCoinciding - 1) / 2) * offsetStep;
                    radius += offset;
                }
                radius = Math.max(effectiveInnerRadius, Math.min(effectiveOuterRadius - 1, radius)); // Ensure within bounds minus tiny bit for stroke

                const x = radius * Math.cos(angle);
                const y = radius * Math.sin(angle);
                if (!isNaN(x) && !isNaN(y)) {
                    positions.push({ point: originalPoint, transformedPoint: point, x, y, sectorIndex: 0, angle });
                }
            });
        });
    } else if (viewMode === 'normal') {
        // Original 'normal' view logic
        const sectorCounts = Array(sectorsCountInRing).fill(0); // Recalculate for point distribution if needed or assume uniform
        transformedPoints.forEach(point => {
            const sectorIndex = calculateSectorIndex(point, ringIndex, true);
            if (sectorIndex >= 0 && sectorIndex < sectorsCountInRing) sectorCounts[sectorIndex]++;
        });

        const sectorsToRender = showEmptySectors ?
            Array.from({ length: sectorsCountInRing }, (_, i) => i) :
            Array.from({ length: sectorsCountInRing }, (_, i) => i).filter(i => sectorCounts[i] > 0);

        const numEffectiveSectors = showEmptySectors ? sectorsCountInRing : sectorsToRender.length;
        const anglePerEffectiveSector = numEffectiveSectors > 0 ? (2 * Math.PI / numEffectiveSectors) : 0;

        transformedPoints.forEach((point, pointIndex) => {
            const originalPoint = dataPointsToPlace[pointIndex];
            const trueSectorIndex = calculateSectorIndex(point, ringIndex, true);

            let displaySectorOrderIndex = trueSectorIndex; // Index for angle calculation
            if (!showEmptySectors) {
                displaySectorOrderIndex = sectorsToRender.indexOf(trueSectorIndex);
                if (displaySectorOrderIndex === -1) return; // Point in an empty sector that's hidden
            }

            if (anglePerEffectiveSector === 0 && numEffectiveSectors > 0) { // Should not happen if sectors > 0
                console.warn("Angle per sector is zero in normal view calculation."); return;
            }


            const startAngle = (anglePerEffectiveSector * displaySectorOrderIndex) + svgGlobalRotationOffset;
            const centerAngle = startAngle + (anglePerEffectiveSector / 2);

            // Original clusterFactor logic
            const clusterFactor = 0.9; // How spread out points are radially
            const radius = innerRadius + (outerRadius - innerRadius) * (0.1 + clusterFactor * (pointIndex % transformedPoints.length) / Math.max(1, transformedPoints.length - 1) * 0.8);


            const x = radius * Math.cos(centerAngle);
            const y = radius * Math.sin(centerAngle);
            positions.push({ point: originalPoint, transformedPoint: point, x, y, sectorIndex: trueSectorIndex, angle: centerAngle });
        });

    } else if (viewMode === 'proportional' && sectorAngleSpans) {
        // Original 'proportional' view logic
        const pointsBySector = {};
        transformedPoints.forEach((point, index) => {
            const sectorIndex = calculateSectorIndex(point, ringIndex, true);
            if (!pointsBySector[sectorIndex]) pointsBySector[sectorIndex] = [];
            pointsBySector[sectorIndex].push({ point: dataPointsToPlace[index], transformedPoint: point, index });
        });

        let currentAngleAccumulator = svgGlobalRotationOffset;
        const sectorStartAngles = sectorAngleSpans.map((angleSpan) => {
            const start = currentAngleAccumulator;
            currentAngleAccumulator += angleSpan;
            return start;
        });

        Object.entries(pointsBySector).forEach(([sectorIdxStr, sectorPts]) => {
            const sectorIdx = parseInt(sectorIdxStr);
            if (sectorIdx < 0 || sectorIdx >= sectorAngleSpans.length) return; // Invalid sector index

            const angleSpanForSector = sectorAngleSpans[sectorIdx];
            if ((!showEmptySectors && angleSpanForSector < 0.001)) return; // Skip tiny/empty if hidden

            const startAngleForSector = sectorStartAngles[sectorIdx];
            const centerAngle = startAngleForSector + (angleSpanForSector / 2);

            sectorPts.forEach(({ point, transformedPoint }, i) => {
                const clusterFactor = 0.9;
                const radius = innerRadius + (outerRadius - innerRadius) * (0.1 + clusterFactor * i / Math.max(1, sectorPts.length - 1) * 0.8);

                const x = radius * Math.cos(centerAngle);
                const y = radius * Math.sin(centerAngle);
                positions.push({ point, transformedPoint, x, y, sectorIndex: sectorIdx, angle: centerAngle });
            });
        });
    }
    return positions;
};


// Validation function - UNCHANGED from your original
export const validateHierarchicalStructure = (sectorAngles, sectorCounts, showEmptySectors = true) => {
    const issues = [];
    // Loop and checks from your original ModularB...
    for (let ringIndex = 0; ringIndex < sectorAngles.length - 1; ringIndex++) {
        const innerAngles = sectorAngles[ringIndex];
        const outerAngles = sectorAngles[ringIndex + 1];
        if (!innerAngles || !outerAngles) continue;


        const innerTotal = innerAngles.reduce((sum, angle) => sum + angle, 0);
        const outerTotal = outerAngles.reduce((sum, angle) => sum + angle, 0);

        const tolerance = 0.1; // Allow small differences
        if (Math.abs(innerTotal - outerTotal) > tolerance) {
            issues.push({
                type: 'angle_mismatch', ringIndex,
                innerTotal: innerTotal * 180 / Math.PI, outerTotal: outerTotal * 180 / Math.PI,
                difference: Math.abs(innerTotal - outerTotal) * 180 / Math.PI
            });
        }

        const ratio = outerAngles.length / innerAngles.length;
        for (let i = 0; i < innerAngles.length; i++) {
            if (innerAngles[i] > 0.001) { // If inner sector has angle
                let hasActiveParent = false;
                for (let j = 0; j < ratio && (i * ratio + j) < outerAngles.length; j++) {
                    const outerIdx = Math.floor(i * ratio + j);
                    if (outerAngles[outerIdx] > 0.001) {
                        hasActiveParent = true; break;
                    }
                }
                if (!hasActiveParent && !showEmptySectors && (sectorCounts[ringIndex][i] || 0) > 0) {
                    // Only an issue if it has points, is not shown empty, and parent has no angle
                    issues.push({ type: 'orphaned_sector', ringIndex, sectorIndex: i, angle: innerAngles[i] * 180 / Math.PI });
                }
            }
        }
    }
    if (issues.length > 0) console.warn('Hierarchical structure validation issues:', issues);
    // else console.log('Hierarchical structure validation passed (original logic)');
    return issues;
};

// Export all original and new transformation functions
export {
    transformPositiveNegative,
    transformZScore,
    transformPercentile,
    transformCustomThreshold,
    transformRadial,
    transformDecisionTree, // NEW EXPORT
    DecisionTree          // NEW EXPORT
};