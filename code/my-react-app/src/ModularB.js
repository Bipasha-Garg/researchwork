// // ringLogic.js - Core logic for rings, sectors, and coordinate transformations

// import * as d3 from "d3";

// /**
//  * Coordinate transformation strategies
//  */
// export const CoordinateTransforms = {
//     POSITIVE_NEGATIVE: 'positive_negative',
//     Z_SCORE: 'z_score',
//     PERCENTILE: 'percentile',
//     CUSTOM_THRESHOLD: 'custom_threshold'
// };

// /**
//  * Transform coordinates based on the selected strategy
//  */
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

//         default:
//             return transformPositiveNegative(points);
//     }
// };

// /**
//  * Original positive/negative transformation
//  */
// const transformPositiveNegative = (points) => {
//     return points.map(point => {
//         const transformedPoint = { ...point };
//         const coordinates = Object.entries(point).filter(([key]) => key !== "Point_ID");

//         coordinates.forEach(([key, value]) => {
//             transformedPoint[`${key}_binary`] = value >= 0 ? 1 : 0;
//         });

//         return transformedPoint;
//     });
// };

// /**
//  * Z-score based transformation
//  */
// const transformZScore = (points, threshold ) => {
//     // Calculate mean and std for each dimension
//     const dimensions = {};
//     const coordinates = Object.keys(points[0]).filter(key => key !== "Point_ID");

//     coordinates.forEach(dim => {
//         const values = points.map(p => p[dim]);
//         const mean = d3.mean(values);
//         const std = d3.deviation(values);
//         dimensions[dim] = { mean, std };
//     });

//     return points.map(point => {
//         const transformedPoint = { ...point };

//         coordinates.forEach(dim => {
//             const zScore =(point[dim] - dimensions[dim].mean) / dimensions[dim].std;
//             transformedPoint[`${dim}_binary`] = zScore >= threshold ? 1 : 0;
//         });

//         return transformedPoint;
//     });
// };

// /**
//  * Percentile based transformation
//  */
// const transformPercentile = (points, percentile) => {
//     const coordinates = Object.keys(points[0]).filter(key => key !== "Point_ID");
//     const thresholds = {};

//     coordinates.forEach(dim => {
//         const values = points.map(p => p[dim]).sort((a, b) => a - b);
//         thresholds[dim] = d3.quantile(values, percentile / 100);
//     });

//     return points.map(point => {
//         const transformedPoint = { ...point };

//         coordinates.forEach(dim => {
//             transformedPoint[`${dim}_binary`] = point[dim] >= thresholds[dim] ? 1 : 0;
//         });

//         return transformedPoint;
//     });
// };

// /**
//  * Custom threshold transformation
//  */
// const transformCustomThreshold = (points, threshold) => {
//     return points.map(point => {
//         const transformedPoint = { ...point };
//         const coordinates = Object.entries(point).filter(([key]) => key !== "Point_ID");

//         coordinates.forEach(([key, value]) => {
//             transformedPoint[`${key}_binary`] = value >= threshold ? 1 : 0;
//         });

//         return transformedPoint;
//     });
// };

// /**
//  * Generate bit vector from transformed coordinates
//  */
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
// /**
//  * Calculate sector assignment for a point
//  */
// export const calculateSectorIndex = (point, ringIndex, useTransformed = true) => {
//     const bitVector = generateBitVector(point, useTransformed);
//     const sectors = 2 ** (ringIndex + 1);
//     const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);
//     console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
//     return sectorIndex;
// };

// /**
//  * Calculate point counts per sector for all rings
//  */
// export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions) => {
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

// /**
//  * Calculate proportional sector angles based on point distribution
//  */
// export const calculateProportionalSectorAngles = (sectorCounts, showEmptySectors = true) => {
//     const sectorAngles = [];
//     const lastRingIndex = sectorCounts.length - 1;

//     for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
//         const sectors = 2 ** (ringIndex + 1);
//         const totalPoints = sectorCounts[ringIndex].reduce((sum, count) => sum + count, 0) || 1;
//         const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

//         if (ringIndex === lastRingIndex) {
//             const emptySectors = sectorCounts[ringIndex].filter(count => count === 0).length;
//             const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

//             const angles = sectorCounts[ringIndex].map(count => {
//                 return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
//             });

//             sectorAngles[ringIndex] = angles;
//         } else {
//             const outerAngles = sectorAngles[ringIndex + 1];
//             const innerSectors = 2 ** (ringIndex + 1);
//             const outerSectors = 2 ** (ringIndex + 2);
//             const ratio = outerSectors / innerSectors;

//             const angles = [];
//             for (let i = 0; i < innerSectors; i++) {
//                 let sumAngle = 0;
//                 for (let j = 0; j < ratio; j++) {
//                     const outerIdx = i * ratio + j;
//                     sumAngle += outerAngles[outerIdx];
//                 }
//                 angles.push(sumAngle);
//             }

//             sectorAngles[ringIndex] = angles;
//         }
//     }

//     return sectorAngles;
// };

// /**
//  * Generate ring structure data
//  */
// export const generateRingStructure = (jsonData) => {
//     const subspaces = Object.keys(jsonData);
//     subspaces.sort((a, b) => a.length - b.length);

//     return subspaces.map((key, index) => ({
//         key,
//         points: jsonData[key] || [],
//         dimensions: key.length,
//         subspaceId: key,
//         ringIndex: index,
//         sectors: 2 ** (index + 1)
//     }));
// };

// /**
//  * Generate color schemes for rings and sectors
//  */
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

// /**
//  * Calculate point positions within sectors
//  */
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
//     transformOptions = {}
// ) => {
//     const transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
//     const rotationOffset = 0;
//     const positions = [];

//     if (viewMode === 'normal') {
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
//                 if (displayIndex === -1)
//                     // displayIndex = sectorsToRender.length > 0 ? sectorsToRender[sectorsToRender.length - 1] : 0;
//                     return;
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

//         Object.entries(pointsBySector).forEach(([sectorIndex, sectorPoints]) => {
//             const sectorIdx = parseInt(sectorIndex);
//             const sectorAngle = sectorAngles[sectorIdx];

//             if (!showEmptySectors && sectorAngle === 0) return;

//             const startAngle = startAngles[sectorIdx];
//             const centerAngle = startAngle + (sectorAngle / 2);

//             sectorPoints.forEach(({ point, transformedPoint, index }, i) => {
//                 const clusterFactor = 0.9;
//                 const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * (i % Math.max(1, sectorPoints.length))) / Math.max(1, sectorPoints.length);

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


// ringLogic.js - Core logic for rings, sectors, and coordinate transformations

import * as d3 from "d3";

/**
 * Coordinate transformation strategies
 */
export const CoordinateTransforms = {
    POSITIVE_NEGATIVE: 'positive_negative',
    Z_SCORE: 'z_score',
    PERCENTILE: 'percentile',
    CUSTOM_THRESHOLD: 'custom_threshold',
    DECISION_TREE: 'decision_tree'  // New decision tree mode
};

/**
 * Decision Tree Node structure
 */
class DecisionTreeNode {
    constructor(feature = null, threshold = null, gini = 1.0, samples = [], depth = 0) {
        this.feature = feature;           // Feature index to split on
        this.threshold = threshold;       // Split threshold
        this.gini = gini;                // Gini impurity
        this.samples = samples;           // Sample indices in this node
        this.depth = depth;               // Depth in tree
        this.left = null;                 // Left child (feature <= threshold)
        this.right = null;                // Right child (feature > threshold)
        this.isLeaf = false;              // Is this a leaf node
        this.prediction = null;           // Predicted class for leaf nodes
        this.sectorIndex = null;          // Sector index for visualization
    }
}

/**
 * Calculate Gini impurity for a set of labels
 */
const calculateGini = (labels) => {
    if (labels.length === 0) return 0;

    const counts = {};
    labels.forEach(label => {
        counts[label] = (counts[label] || 0) + 1;
    });

    let gini = 1.0;
    const total = labels.length;

    Object.values(counts).forEach(count => {
        const probability = count / total;
        gini -= probability * probability;
    });

    return gini;
};

/**
 * Find the best split for a set of samples
 */
const findBestSplit = (points, labels, featureNames, maxDepth, currentDepth) => {
    if (currentDepth >= maxDepth) return null;

    let bestGini = Infinity;
    let bestFeature = null;
    let bestThreshold = null;
    let bestLeftIndices = [];
    let bestRightIndices = [];

    featureNames.forEach((feature, featureIndex) => {
        // Get unique values for this feature
        const values = [...new Set(points.map(p => p[feature]))].sort((a, b) => a - b);

        // Try each possible threshold
        for (let i = 0; i < values.length - 1; i++) {
            const threshold = (values[i] + values[i + 1]) / 2;

            const leftIndices = [];
            const rightIndices = [];
            const leftLabels = [];
            const rightLabels = [];

            points.forEach((point, index) => {
                if (point[feature] <= threshold) {
                    leftIndices.push(index);
                    leftLabels.push(labels[index]);
                } else {
                    rightIndices.push(index);
                    rightLabels.push(labels[index]);
                }
            });

            // Skip if split doesn't separate data
            if (leftIndices.length === 0 || rightIndices.length === 0) continue;

            // Calculate weighted Gini impurity
            const totalSamples = points.length;
            const leftGini = calculateGini(leftLabels);
            const rightGini = calculateGini(rightLabels);
            const weightedGini = (leftIndices.length / totalSamples) * leftGini +
                (rightIndices.length / totalSamples) * rightGini;

            if (weightedGini < bestGini) {
                bestGini = weightedGini;
                bestFeature = feature;
                bestThreshold = threshold;
                bestLeftIndices = leftIndices;
                bestRightIndices = rightIndices;
            }
        }
    });

    return bestFeature ? {
        feature: bestFeature,
        threshold: bestThreshold,
        leftIndices: bestLeftIndices,
        rightIndices: bestRightIndices,
        gini: bestGini
    } : null;
};

/**
 * Build decision tree recursively
 */
const buildDecisionTree = (points, labels, sampleIndices, featureNames, maxDepth = 3, currentDepth = 0) => {
    const currentLabels = sampleIndices.map(i => labels[i]);
    const currentPoints = sampleIndices.map(i => points[i]);
    const gini = calculateGini(currentLabels);

    const node = new DecisionTreeNode(null, null, gini, sampleIndices, currentDepth);

    // Check stopping criteria
    if (currentDepth >= maxDepth || gini === 0 || currentPoints.length < 2) {
        node.isLeaf = true;
        // Find most common label
        const labelCounts = {};
        currentLabels.forEach(label => {
            labelCounts[label] = (labelCounts[label] || 0) + 1;
        });
        node.prediction = Object.keys(labelCounts).reduce((a, b) =>
            labelCounts[a] > labelCounts[b] ? a : b
        );
        return node;
    }

    // Find best split
    const bestSplit = findBestSplit(currentPoints, currentLabels, featureNames, maxDepth, currentDepth);

    if (!bestSplit) {
        node.isLeaf = true;
        const labelCounts = {};
        currentLabels.forEach(label => {
            labelCounts[label] = (labelCounts[label] || 0) + 1;
        });
        node.prediction = Object.keys(labelCounts).reduce((a, b) =>
            labelCounts[a] > labelCounts[b] ? a : b
        );
        return node;
    }

    // Set node properties
    node.feature = bestSplit.feature;
    node.threshold = bestSplit.threshold;

    // Create child nodes
    const leftSampleIndices = bestSplit.leftIndices.map(i => sampleIndices[i]);
    const rightSampleIndices = bestSplit.rightIndices.map(i => sampleIndices[i]);

    node.left = buildDecisionTree(points, labels, leftSampleIndices, featureNames, maxDepth, currentDepth + 1);
    node.right = buildDecisionTree(points, labels, rightSampleIndices, featureNames, maxDepth, currentDepth + 1);

    return node;
};

/**
 * Collect nodes by depth level
 */
const collectNodesByDepth = (root, maxDepth) => {
    const nodesByDepth = [];
    for (let i = 0; i <= maxDepth; i++) {
        nodesByDepth.push([]);
    }

    const traverse = (node) => {
        if (!node) return;
        nodesByDepth[node.depth].push(node);
        traverse(node.left);
        traverse(node.right);
    };

    traverse(root);
    return nodesByDepth;
};

/**
 * Assign sector indices to nodes for visualization
 */
const assignSectorIndices = (nodesByDepth) => {
    nodesByDepth.forEach((nodes, depth) => {
        nodes.forEach((node, index) => {
            node.sectorIndex = index;
        });
    });
};

/**
 * Generate decision tree structure for visualization
 */
export const generateDecisionTreeStructure = (points, labelsData, maxDepth = 3) => {
    if (!points || points.length === 0) return null;
    if (!labelsData || !labelsData.labels) return null;

    // Prepare labels array aligned with points
    const labels = points.map(point => {
        const pointIds = Array.isArray(point.Point_ID) ? point.Point_ID : [point.Point_ID];

        // Find which label this point belongs to
        for (const [labelName, pointList] of Object.entries(labelsData.labels)) {
            if (pointIds.some(id => pointList.includes(Number(id)))) {
                return labelName;
            }
        }
        return 'unlabeled';
    });

    // Get feature names (exclude Point_ID)
    const featureNames = Object.keys(points[0]).filter(key => key !== 'Point_ID');

    // Build the decision tree
    const sampleIndices = Array.from({ length: points.length }, (_, i) => i);
    const root = buildDecisionTree(points, labels, sampleIndices, featureNames, maxDepth);

    // Collect nodes by depth
    const nodesByDepth = collectNodesByDepth(root, maxDepth);

    // Assign sector indices
    assignSectorIndices(nodesByDepth);

    return {
        root,
        nodesByDepth,
        featureNames,
        maxDepth
    };
};

/**
 * Calculate point path through decision tree
 */
export const calculateDecisionPath = (point, decisionTree) => {
    if (!decisionTree || !decisionTree.root) return [];

    const path = [];
    let currentNode = decisionTree.root;

    while (currentNode && !currentNode.isLeaf) {
        path.push({
            node: currentNode,
            depth: currentNode.depth,
            sectorIndex: currentNode.sectorIndex,
            decision: point[currentNode.feature] <= currentNode.threshold ? 'left' : 'right',
            featureValue: point[currentNode.feature]
        });

        if (point[currentNode.feature] <= currentNode.threshold) {
            currentNode = currentNode.left;
        } else {
            currentNode = currentNode.right;
        }
    }

    // Add leaf node
    if (currentNode) {
        path.push({
            node: currentNode,
            depth: currentNode.depth,
            sectorIndex: currentNode.sectorIndex,
            decision: 'leaf',
            prediction: currentNode.prediction
        });
    }

    return path;
};

/**
 * Transform coordinates based on the selected strategy
 */
export const transformCoordinates = (points, strategy, options = {}) => {
    switch (strategy) {
        case CoordinateTransforms.POSITIVE_NEGATIVE:
            return transformPositiveNegative(points);

        case CoordinateTransforms.Z_SCORE:
            return transformZScore(points, options.threshold || 0);

        case CoordinateTransforms.PERCENTILE:
            return transformPercentile(points, options.percentile || 50);

        case CoordinateTransforms.CUSTOM_THRESHOLD:
            return transformCustomThreshold(points, options.threshold || 0);

        case CoordinateTransforms.DECISION_TREE:
            return points; // Return original points for decision tree mode

        default:
            return transformPositiveNegative(points);
    }
};

/**
 * Original positive/negative transformation
 */
const transformPositiveNegative = (points) => {
    return points.map(point => {
        const transformedPoint = { ...point };
        const coordinates = Object.entries(point).filter(([key]) => key !== "Point_ID");

        coordinates.forEach(([key, value]) => {
            transformedPoint[`${key}_binary`] = value >= 0 ? 1 : 0;
        });

        return transformedPoint;
    });
};

/**
 * Z-score based transformation
 */
const transformZScore = (points, threshold) => {
    // Calculate mean and std for each dimension
    const dimensions = {};
    const coordinates = Object.keys(points[0]).filter(key => key !== "Point_ID");

    coordinates.forEach(dim => {
        const values = points.map(p => p[dim]);
        const mean = d3.mean(values);
        const std = d3.deviation(values);
        dimensions[dim] = { mean, std };
    });

    return points.map(point => {
        const transformedPoint = { ...point };

        coordinates.forEach(dim => {
            const zScore = (point[dim] - dimensions[dim].mean) / dimensions[dim].std;
            transformedPoint[`${dim}_binary`] = zScore >= threshold ? 1 : 0;
        });

        return transformedPoint;
    });
};

/**
 * Percentile based transformation
 */
const transformPercentile = (points, percentile) => {
    const coordinates = Object.keys(points[0]).filter(key => key !== "Point_ID");
    const thresholds = {};

    coordinates.forEach(dim => {
        const values = points.map(p => p[dim]).sort((a, b) => a - b);
        thresholds[dim] = d3.quantile(values, percentile / 100);
    });

    return points.map(point => {
        const transformedPoint = { ...point };

        coordinates.forEach(dim => {
            transformedPoint[`${dim}_binary`] = point[dim] >= thresholds[dim] ? 1 : 0;
        });

        return transformedPoint;
    });
};

/**
 * Custom threshold transformation
 */
const transformCustomThreshold = (points, threshold) => {
    return points.map(point => {
        const transformedPoint = { ...point };
        const coordinates = Object.entries(point).filter(([key]) => key !== "Point_ID");

        coordinates.forEach(([key, value]) => {
            transformedPoint[`${key}_binary`] = value >= threshold ? 1 : 0;
        });

        return transformedPoint;
    });
};

/**
 * Generate bit vector from transformed coordinates
 */
export const generateBitVector = (point, useTransformed = true) => {
    const coordinates = Object.entries(point).filter(([key]) => {
        if (useTransformed) {
            return key.endsWith('_binary');
        }
        return key !== "Point_ID" && !key.endsWith('_binary');
    });

    if (useTransformed) {
        const bitVector = coordinates.map(([_, value]) => value).join("");
        console.log(`Point ${point.Point_ID}, Bit Vector: ${bitVector}`);
        return bitVector;
    } else {
        const bitVector = coordinates.map(([_, value]) => (value >= 0 ? 1 : 0)).join("");
        console.log(`Point ${point.Point_ID}, Bit Vector (untransformed): ${bitVector}`);
        return bitVector;
    }
};

/**
 * Calculate sector assignment for a point
 */
export const calculateSectorIndex = (point, ringIndex, useTransformed = true) => {
    const bitVector = generateBitVector(point, useTransformed);
    const sectors = 2 ** (ringIndex + 1);
    const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);
    console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
    return sectorIndex;
};

/**
 * Calculate sector assignment for decision tree mode
 */
export const calculateDecisionTreeSectorIndex = (point, depth, decisionTree) => {
    if (!decisionTree) return 0;

    const path = calculateDecisionPath(point, decisionTree);
    if (depth < path.length) {
        return path[depth].sectorIndex;
    }
    return 0;
};

/**
 * Calculate point counts per sector for all rings
 */
export const calculateSectorPointCounts = (pointsData, transformStrategy, transformOptions, labelsData = null) => {
    if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
        return calculateDecisionTreeSectorCounts(pointsData, transformOptions, labelsData);
    }

    return pointsData.map((ringData, index) => {
        const transformedPoints = transformCoordinates(ringData.points, transformStrategy, transformOptions);
        const sectors = 2 ** (index + 1);
        const counts = Array(sectors).fill(0);

        transformedPoints.forEach(point => {
            const sectorIndex = calculateSectorIndex(point, index, true);
            counts[sectorIndex]++;
        });

        return counts;
    });
};

/**
 * Calculate sector counts for decision tree mode
 */
const calculateDecisionTreeSectorCounts = (pointsData, transformOptions, labelsData) => {
    if (!pointsData || pointsData.length === 0) return [];

    const allPoints = pointsData.flatMap(ring => ring.points);
    const maxDepth = transformOptions.maxDepth || 3;

    const decisionTree = generateDecisionTreeStructure(allPoints, labelsData, maxDepth);
    if (!decisionTree) return [];

    const sectorCounts = [];

    // For each depth level, count points in each sector (node)
    for (let depth = 0; depth <= maxDepth; depth++) {
        const nodesAtDepth = decisionTree.nodesByDepth[depth] || [];
        const counts = Array(Math.max(1, nodesAtDepth.length)).fill(0);

        nodesAtDepth.forEach(node => {
            counts[node.sectorIndex] = node.samples.length;
        });

        sectorCounts.push(counts);
    }

    return sectorCounts;
};

/**
 * Calculate proportional sector angles based on point distribution
 */
export const calculateProportionalSectorAngles = (sectorCounts, showEmptySectors = true) => {
    const sectorAngles = [];
    const lastRingIndex = sectorCounts.length - 1;

    for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
        const sectors = sectorCounts[ringIndex].length;
        const totalPoints = sectorCounts[ringIndex].reduce((sum, count) => sum + count, 0) || 1;
        const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

        if (ringIndex === lastRingIndex) {
            const emptySectors = sectorCounts[ringIndex].filter(count => count === 0).length;
            const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

            const angles = sectorCounts[ringIndex].map(count => {
                return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
            });

            sectorAngles[ringIndex] = angles;
        } else {
            const outerAngles = sectorAngles[ringIndex + 1];
            const innerSectors = sectorCounts[ringIndex].length;
            const outerSectors = sectorCounts[ringIndex + 1].length;

            if (outerSectors === 0) {
                sectorAngles[ringIndex] = Array(innerSectors).fill(2 * Math.PI / innerSectors);
                continue;
            }

            const ratio = outerSectors / innerSectors;

            const angles = [];
            for (let i = 0; i < innerSectors; i++) {
                let sumAngle = 0;
                for (let j = 0; j < ratio && (i * ratio + j) < outerSectors; j++) {
                    const outerIdx = Math.floor(i * ratio + j);
                    sumAngle += outerAngles[outerIdx] || 0;
                }
                angles.push(sumAngle || (2 * Math.PI / innerSectors));
            }

            sectorAngles[ringIndex] = angles;
        }
    }

    return sectorAngles;
};

/**
 * Generate ring structure data
 */
export const generateRingStructure = (jsonData, transformStrategy = null, transformOptions = {}, labelsData = null) => {
    if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
        return generateDecisionTreeRingStructure(jsonData, transformOptions, labelsData);
    }

    const subspaces = Object.keys(jsonData);
    subspaces.sort((a, b) => a.length - b.length);

    return subspaces.map((key, index) => ({
        key,
        points: jsonData[key] || [],
        dimensions: key.length,
        subspaceId: key,
        ringIndex: index,
        sectors: 2 ** (index + 1)
    }));
};

/**
 * Generate ring structure for decision tree mode
 */
const generateDecisionTreeRingStructure = (jsonData, transformOptions, labelsData) => {
    const allPoints = Object.values(jsonData).flatMap(points => points);
    const maxDepth = transformOptions.maxDepth || 3;

    const decisionTree = generateDecisionTreeStructure(allPoints, labelsData, maxDepth);
    if (!decisionTree) return [];

    const ringStructure = [];

    // Create a ring for each depth level
    for (let depth = 0; depth <= maxDepth; depth++) {
        const nodesAtDepth = decisionTree.nodesByDepth[depth] || [];

        ringStructure.push({
            key: `decision_tree_depth_${depth}`,
            points: allPoints, // All points are available at each level
            dimensions: depth + 1,
            subspaceId: `dt_${depth}`,
            ringIndex: depth,
            sectors: Math.max(1, nodesAtDepth.length),
            decisionTree: decisionTree,
            nodesAtDepth: nodesAtDepth,
            isDecisionTree: true
        });
    }

    return ringStructure;
};

/**
 * Generate color schemes for rings and sectors
 */
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

/**
 * Calculate point positions within sectors
 */
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
    if (transformStrategy === CoordinateTransforms.DECISION_TREE && ring && ring.isDecisionTree) {
        return calculateDecisionTreePointPositions(
            points,
            ringIndex,
            innerRadius,
            outerRadius,
            ring,
            sectorAngles,
            viewMode,
            showEmptySectors
        );
    }

    const transformedPoints = transformCoordinates(points, transformStrategy, transformOptions);
    const rotationOffset = 0;
    const positions = [];

    if (viewMode === 'normal') {
        const sectorCounts = Array(sectors).fill(0);
        transformedPoints.forEach(point => {
            const sectorIndex = calculateSectorIndex(point, ringIndex, true);
            sectorCounts[sectorIndex]++;
        });

        const sectorsToRender = showEmptySectors ?
            Array.from({ length: sectors }, (_, i) => i) :
            Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

        const anglePerSector = 2 * Math.PI / (showEmptySectors ? sectors : sectorsToRender.length);

        transformedPoints.forEach((point, pointIndex) => {
            const originalPoint = points[pointIndex];
            const sectorIndex = calculateSectorIndex(point, ringIndex, true);

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
        });
    } else if (viewMode === 'proportional' && sectorAngles) {
        const pointsBySector = {};
        transformedPoints.forEach((point, index) => {
            const sectorIndex = calculateSectorIndex(point, ringIndex, true);
            if (!pointsBySector[sectorIndex]) {
                pointsBySector[sectorIndex] = [];
            }
            pointsBySector[sectorIndex].push({ point: points[index], transformedPoint: point, index });
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

            if (!showEmptySectors && sectorAngle === 0) return;

            const startAngle = startAngles[sectorIdx];
            const centerAngle = startAngle + (sectorAngle / 2);

            sectorPoints.forEach(({ point, transformedPoint, index }, i) => {
                const clusterFactor = 0.9;
                const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * (i % Math.max(1, sectorPoints.length))) / Math.max(1, sectorPoints.length);

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

    return positions;
};

/**
 * Calculate point positions for decision tree mode
 */
const calculateDecisionTreePointPositions = (
    points,
    ringIndex,
    innerRadius,
    outerRadius,
    ring,
    sectorAngles = null,
    viewMode = 'normal',
    showEmptySectors = true
) => {
    const positions = [];
    const rotationOffset = 0;
    const decisionTree = ring.decisionTree;

    if (!decisionTree) return positions;

    // Group points by which node they belong to at this depth
    const pointsByNode = {};

    points.forEach((point, pointIndex) => {
        const path = calculateDecisionPath(point, decisionTree);

        if (ringIndex < path.length) {
            const nodeAtDepth = path[ringIndex];
            const sectorIndex = nodeAtDepth.sectorIndex;

            if (!pointsByNode[sectorIndex]) {
                pointsByNode[sectorIndex] = [];
            }
            pointsByNode[sectorIndex].push({ point, pointIndex });
        }
    });

    if (viewMode === 'normal') {
        const nodesAtDepth = ring.nodesAtDepth || [];
        const anglePerSector = 2 * Math.PI / Math.max(1, nodesAtDepth.length);

        Object.entries(pointsByNode).forEach(([sectorIndex, sectorPoints]) => {
            const sectorIdx = parseInt(sectorIndex);
            const startAngle = (anglePerSector * sectorIdx) + rotationOffset;
            const centerAngle = startAngle + (anglePerSector / 2);

            sectorPoints.forEach(({ point, pointIndex }, i) => {
                const clusterFactor = 0.9;
                const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * (i % Math.max(1, sectorPoints.length))) / Math.max(1, sectorPoints.length);

                const x = radius * Math.cos(centerAngle);
                const y = radius * Math.sin(centerAngle);

                positions.push({
                    point,
                    transformedPoint: point,
                    x,
                    y,
                    sectorIndex: sectorIdx,
                    angle: centerAngle
                });
            });
        });
    } else if (viewMode === 'proportional' && sectorAngles) {
        let currentAngle = rotationOffset;
        const startAngles = sectorAngles.map((angle) => {
            const start = currentAngle;
            currentAngle += angle;
            return start;
        });

        Object.entries(pointsByNode).forEach(([sectorIndex, sectorPoints]) => {
            const sectorIdx = parseInt(sectorIndex);
            const sectorAngle = sectorAngles[sectorIdx] || 0;

            if (!showEmptySectors && sectorAngle === 0) return;

            const startAngle = startAngles[sectorIdx] || 0;
            const centerAngle = startAngle + (sectorAngle / 2);

            sectorPoints.forEach(({ point, pointIndex }, i) => {
                const clusterFactor = 0.9;
                const radius = innerRadius + (clusterFactor * (outerRadius - innerRadius) * (i % Math.max(1, sectorPoints.length))) / Math.max(1, sectorPoints.length);

                const x = radius * Math.cos(centerAngle);
                const y = radius * Math.sin(centerAngle);

                positions.push({
                    point,
                    transformedPoint: point,
                    x,
                    y,
                    sectorIndex: sectorIdx,
                    angle: centerAngle
                });
            });
        });
    }

    return positions;
};