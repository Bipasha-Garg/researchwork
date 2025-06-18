// import * as d3 from "d3";

// class DecisionTreeNode {
//     constructor(data, depth = 0, nodeId = 0) {
//         this.nodeId = nodeId;
//         this.depth = depth;
//         this.data = data;
//         this.feature = null;
//         this.threshold = null;
//         this.left = null;
//         this.right = null;
//         this.isLeaf = false;
//         this.giniImpurity = 0;
//         this.classCounts = {};
//         this.majorityClass = null;
//         this.samples = data.length;

//         this.sectorIndex = 0;
//         this.angle = 0;
//         this.startAngle = 0;
//         this.endAngle = 0;
//         this.radius = 0;
//         this.x = 0;
//         this.y = 0;
//         this.sector = null;
//         this.pointsInSector = [];
//     }

//     calculateClassDistribution(labelsData) {
//         this.classCounts = {};

//         if (!labelsData || !labelsData.labels) {
//             this.classCounts['unlabeled'] = this.data.length;
//             this.majorityClass = 'unlabeled';
//             return;
//         }

//         Object.keys(labelsData.labels).forEach(label => {
//             this.classCounts[label] = 0;
//         });

//         this.data.forEach(point => {
//             const pointId = point.Point_ID;
//             let assigned = false;

//             Object.entries(labelsData.labels).forEach(([label, pointList]) => {
//                 if (Array.isArray(pointList) && pointList.includes(Number(pointId))) {
//                     this.classCounts[label]++;
//                     assigned = true;
//                 }
//             });

//             if (!assigned) {
//                 if (!this.classCounts['unlabeled']) {
//                     this.classCounts['unlabeled'] = 0;
//                 }
//                 this.classCounts['unlabeled']++;
//             }
//         });

//         this.majorityClass = Object.entries(this.classCounts)
//             .reduce((max, [label, count]) => count > max.count ? { label, count } : max,
//                 { label: 'unlabeled', count: 0 }).label;
//     }

//     calculateGiniImpurity() {
//         const total = this.samples;
//         if (total === 0) {
//             this.giniImpurity = 0;
//             return 0;
//         }

//         let gini = 1.0;
//         Object.values(this.classCounts).forEach(count => {
//             const probability = count / total;
//             gini -= probability * probability;
//         });

//         this.giniImpurity = gini;
//         return gini;
//     }

//     calculateSectorProperties(centerX = 0, centerY = 0, baseRadius = 50) {
//         this.radius = baseRadius + (this.depth * 60);

//         const midAngle = this.startAngle + (this.angle / 2);
//         this.x = centerX + Math.cos(midAngle) * this.radius;
//         this.y = centerY + Math.sin(midAngle) * this.radius;

//         this.endAngle = this.startAngle + this.angle;

//         this.sector = {
//             innerRadius: this.depth === 0 ? 0 : baseRadius + ((this.depth - 1) * 60),
//             outerRadius: this.radius + 30,
//             startAngle: this.startAngle,
//             endAngle: this.endAngle,
//             centerX: this.x,
//             centerY: this.y,
//             midAngle: midAngle
//         };
//     }

//     assignPointsToSector(allPoints) {
//         this.pointsInSector = [];

//         allPoints.forEach(point => {
//             if (this.containsPoint(point)) {
//                 const pointAngle = this.startAngle + (Math.random() * this.angle);
//                 const pointRadius = this.sector.innerRadius + (Math.random() * 30);

//                 const pointData = {
//                     ...point,
//                     sectorAngle: pointAngle,
//                     sectorRadius: pointRadius,
//                     sectorX: Math.cos(pointAngle) * pointRadius,
//                     sectorY: Math.sin(pointAngle) * pointRadius,
//                     nodeId: this.nodeId,
//                     depth: this.depth
//                 };

//                 this.pointsInSector.push(pointData);
//             }
//         });
//     }

//     containsPoint(point) {
//         return this.data.some(nodePoint => nodePoint.Point_ID === point.Point_ID);
//     }
// }

// export class DecisionTree {
//     constructor(options = {}) {
//         this.maxDepth = options.maxDepth || 5;
//         this.minSamplesLeaf = options.minSamplesLeaf || 2;
//         this.minSamplesSplit = options.minSamplesSplit || 2;
//         this.maxFeatures = options.maxFeatures || null;
//         this.randomState = options.randomState || 42;
//         this.root = null;
//         this.nodeCounter = 0;
//         this.levels = [];
//         this.features = [];

//         this.centerX = options.centerX || 0;
//         this.centerY = options.centerY || 0;
//         this.baseRadius = options.baseRadius || 50;
//         this.sectors = [];
//         this.allNodes = [];
//     }

//     fit(data, labelsData = null) {
//         console.log("=== DECISION TREE TRAINING START ===");
//         console.log(`Training data: ${data.length} points`);

//         this.features = this._extractFeatures(data);
//         console.log(`Available features: ${this.features.join(', ')}`);

//         this.levels = [];
//         this.nodeCounter = 0;
//         this.allNodes = [];

//         this.root = this._buildTree(data, labelsData, 0);
//         this._organizeLevels();
//         this._calculateCircularLayout();
//         this._assignPointsToSectors(data);

//         console.log(`Decision tree built with ${this.levels.length} levels`);
//         console.log("=== DECISION TREE TRAINING END ===");

//         return this;
//     }

//     _extractFeatures(data) {
//         if (data.length === 0) return [];

//         const sample = data[0];
//         return Object.keys(sample).filter(key => {
//             return key !== 'Point_ID' &&
//                 !key.endsWith('_binary') &&
//                 typeof sample[key] === 'number' &&
//                 !isNaN(sample[key]);
//         });
//     }

//     _buildTree(data, labelsData, depth, parentId = null) {
//         const nodeId = this.nodeCounter++;
//         const node = new DecisionTreeNode(data, depth, nodeId);

//         this.allNodes.push(node);

//         node.calculateClassDistribution(labelsData);
//         node.calculateGiniImpurity();

//         console.log(`Node ${nodeId} at depth ${depth}: ${data.length} samples, Gini: ${node.giniImpurity.toFixed(3)}`);

//         if (this._shouldStop(node, depth)) {
//             node.isLeaf = true;
//             console.log(`  -> Leaf node (class: ${node.majorityClass})`);
//             return node;
//         }

//         const bestSplit = this._findBestSplit(data, labelsData);

//         if (!bestSplit || bestSplit.giniGain <= 0) {
//             node.isLeaf = true;
//             console.log(`  -> Leaf node (no good split found)`);
//             return node;
//         }

//         node.feature = bestSplit.feature;
//         node.threshold = bestSplit.threshold;

//         console.log(`  -> Split on ${bestSplit.feature} <= ${bestSplit.threshold.toFixed(3)} (gain: ${bestSplit.giniGain.toFixed(3)})`);

//         const leftData = bestSplit.leftData;
//         const rightData = bestSplit.rightData;

//         if (leftData.length > 0) {
//             node.left = this._buildTree(leftData, labelsData, depth + 1, nodeId);
//         }

//         if (rightData.length > 0) {
//             node.right = this._buildTree(rightData, labelsData, depth + 1, nodeId);
//         }

//         return node;
//     }

//     _shouldStop(node, depth) {
//         return depth >= this.maxDepth ||
//             node.samples < this.minSamplesSplit ||
//             node.giniImpurity === 0 ||
//             Object.keys(node.classCounts).length <= 1;
//     }

//     _findBestSplit(data, labelsData) {
//         if (data.length === 0) return null;

//         let bestSplit = null;
//         let bestGiniGain = 0;

//         const featuresToConsider = this._selectFeatures();

//         featuresToConsider.forEach(feature => {
//             const split = this._findBestSplitForFeature(data, labelsData, feature);
//             if (split && split.giniGain > bestGiniGain) {
//                 bestGiniGain = split.giniGain;
//                 bestSplit = split;
//             }
//         });

//         return bestSplit;
//     }

//     _selectFeatures() {
//         if (this.maxFeatures === null) {
//             return [...this.features];
//         }

//         let numFeatures;
//         if (this.maxFeatures === 'sqrt') {
//             numFeatures = Math.floor(Math.sqrt(this.features.length));
//         } else if (this.maxFeatures === 'log2') {
//             numFeatures = Math.floor(Math.log2(this.features.length));
//         } else if (typeof this.maxFeatures === 'number') {
//             numFeatures = Math.min(this.maxFeatures, this.features.length);
//         } else {
//             numFeatures = this.features.length;
//         }

//         const shuffled = [...this.features].sort(() => Math.random() - 0.5);
//         return shuffled.slice(0, numFeatures);
//     }

//     _findBestSplitForFeature(data, labelsData, feature) {
//         const values = [...new Set(data.map(point => point[feature]))].sort((a, b) => a - b);

//         if (values.length <= 1) return null;

//         let bestThreshold = null;
//         let bestGiniGain = 0;
//         let bestLeftData = null;
//         let bestRightData = null;

//         for (let i = 0; i < values.length - 1; i++) {
//             const threshold = (values[i] + values[i + 1]) / 2;

//             const leftData = data.filter(point => point[feature] <= threshold);
//             const rightData = data.filter(point => point[feature] > threshold);

//             if (leftData.length < this.minSamplesLeaf || rightData.length < this.minSamplesLeaf) {
//                 continue;
//             }

//             const giniGain = this._calculateGiniGain(data, leftData, rightData, labelsData);

//             if (giniGain > bestGiniGain) {
//                 bestGiniGain = giniGain;
//                 bestThreshold = threshold;
//                 bestLeftData = leftData;
//                 bestRightData = rightData;
//             }
//         }

//         if (bestThreshold === null) return null;

//         return {
//             feature,
//             threshold: bestThreshold,
//             giniGain: bestGiniGain,
//             leftData: bestLeftData,
//             rightData: bestRightData
//         };
//     }

//     _calculateGiniGain(parentData, leftData, rightData, labelsData) {
//         const parentNode = new DecisionTreeNode(parentData);
//         parentNode.calculateClassDistribution(labelsData);
//         const parentGini = parentNode.calculateGiniImpurity();

//         const leftNode = new DecisionTreeNode(leftData);
//         leftNode.calculateClassDistribution(labelsData);
//         const leftGini = leftNode.calculateGiniImpurity();

//         const rightNode = new DecisionTreeNode(rightData);
//         rightNode.calculateClassDistribution(labelsData);
//         const rightGini = rightNode.calculateGiniImpurity();

//         const total = parentData.length;
//         const leftWeight = leftData.length / total;
//         const rightWeight = rightData.length / total;

//         const weightedGini = leftWeight * leftGini + rightWeight * rightGini;
//         return parentGini - weightedGini;
//     }

//     _organizeLevels() {
//         this.levels = [];
//         this._traverseByLevel(this.root);
//     }

//     _traverseByLevel(node) {
//         if (!node) return;

//         const level = node.depth;
//         if (!this.levels[level]) {
//             this.levels[level] = [];
//         }

//         this.levels[level].push(node);

//         if (node.left) this._traverseByLevel(node.left);
//         if (node.right) this._traverseByLevel(node.right);
//     }

//     _calculateCircularLayout() {
//         if (this.levels.length === 0) return;

//         for (let levelIndex = this.levels.length - 1; levelIndex >= 0; levelIndex--) {
//             const nodes = this.levels[levelIndex];

//             if (levelIndex === this.levels.length - 1) {
//                 this._distributeLeafNodes(nodes);
//             } else {
//                 this._calculateInternalNodeAngles(nodes);
//             }

//             nodes.forEach(node => {
//                 node.calculateSectorProperties(this.centerX, this.centerY, this.baseRadius);
//             });
//         }

//         this._createSectorArray();
//     }

//     _distributeLeafNodes(leafNodes) {
//         const totalAngle = 2 * Math.PI;
//         const anglePerNode = totalAngle / leafNodes.length;

//         leafNodes.forEach((node, index) => {
//             node.startAngle = index * anglePerNode;
//             node.angle = anglePerNode;
//             node.sectorIndex = index;
//         });
//     }

//     _calculateInternalNodeAngles(nodes) {
//         nodes.forEach((node, index) => {
//             const children = this._getDirectChildren(node);

//             if (children.length === 0) {
//                 node.angle = 0.1;
//                 node.startAngle = index * 0.1;
//             } else {
//                 const childStartAngles = children.map(child => child.startAngle);
//                 const childEndAngles = children.map(child => child.startAngle + child.angle);

//                 node.startAngle = Math.min(...childStartAngles);
//                 const endAngle = Math.max(...childEndAngles);
//                 node.angle = endAngle - node.startAngle;
//             }

//             node.sectorIndex = index;
//         });
//     }

//     _getDirectChildren(node) {
//         const children = [];
//         if (node.left) children.push(node.left);
//         if (node.right) children.push(node.right);
//         return children;
//     }

//     _createSectorArray() {
//         this.sectors = [];
//         this.allNodes.forEach(node => {
//             if (node.sector) {
//                 this.sectors.push({
//                     node: node,
//                     sector: node.sector,
//                     isLeaf: node.isLeaf,
//                     depth: node.depth,
//                     samples: node.samples,
//                     majorityClass: node.majorityClass,
//                     giniImpurity: node.giniImpurity,
//                     classCounts: node.classCounts
//                 });
//             }
//         });
//     }

//     _assignPointsToSectors(allPoints) {
//         this.allNodes.forEach(node => {
//             node.assignPointsToSector(allPoints);
//         });
//     }

//     getPointsInPath(point) {
//         const path = [];
//         let currentNode = this.root;

//         while (currentNode) {
//             path.push({
//                 node: currentNode,
//                 sector: currentNode.sector,
//                 isDecisionPoint: !currentNode.isLeaf
//             });

//             if (currentNode.isLeaf) {
//                 break;
//             }

//             const featureValue = point[currentNode.feature];
//             currentNode = featureValue <= currentNode.threshold ? currentNode.left : currentNode.right;
//         }

//         return path;
//     }

//     getSectorConnections() {
//         const connections = [];

//         this.allNodes.forEach(node => {
//             if (!node.isLeaf) {
//                 const children = this._getDirectChildren(node);
//                 children.forEach(child => {
//                     connections.push({
//                         parent: node.sector,
//                         child: child.sector,
//                         parentNode: node,
//                         childNode: child,
//                         feature: node.feature,
//                         threshold: node.threshold,
//                         direction: child === node.left ? 'left' : 'right'
//                     });
//                 });
//             }
//         });

//         return connections;
//     }

//     getPointsByLabelInSectors() {
//         const labeledSectors = {};

//         this.allNodes.forEach(node => {
//             if (node.pointsInSector.length > 0) {
//                 labeledSectors[node.nodeId] = {};

//                 Object.keys(node.classCounts).forEach(label => {
//                     labeledSectors[node.nodeId][label] = node.pointsInSector.filter(point => {
//                         return this._getPointLabel(point) === label;
//                     });
//                 });
//             }
//         });

//         return labeledSectors;
//     }

//     _getPointLabel(point) {
//         return point.label || 'unlabeled';
//     }

//     getCircularTreeStructure() {
//         return {
//             levels: this.levels,
//             sectors: this.sectors,
//             connections: this.getSectorConnections(),
//             root: this.root,
//             allNodes: this.allNodes,
//             depth: this.levels.length,
//             totalNodes: this.nodeCounter,
//             centerX: this.centerX,
//             centerY: this.centerY,
//             baseRadius: this.baseRadius,
//             labeledSectors: this.getPointsByLabelInSectors()
//         };
//     }

//     predict(data) {
//         if (!this.root) {
//             throw new Error("Decision tree has not been trained yet");
//         }

//         return data.map(point => this._predictSingle(point, this.root));
//     }

//     _predictSingle(point, node) {
//         if (node.isLeaf) {
//             return node.majorityClass;
//         }

//         if (point[node.feature] <= node.threshold) {
//             return node.left ? this._predictSingle(point, node.left) : node.majorityClass;
//         } else {
//             return node.right ? this._predictSingle(point, node.right) : node.majorityClass;
//         }
//     }

//     getFeatureImportance() {
//         const importance = {};
//         this.features.forEach(feature => {
//             importance[feature] = 0;
//         });

//         this._calculateFeatureImportance(this.root, importance);

//         const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
//         if (total > 0) {
//             Object.keys(importance).forEach(feature => {
//                 importance[feature] /= total;
//             });
//         }

//         return importance;
//     }

//     _calculateFeatureImportance(node, importance) {
//         if (!node || node.isLeaf) return;

//         const leftSamples = node.left ? node.left.samples : 0;
//         const rightSamples = node.right ? node.right.samples : 0;
//         const totalSamples = leftSamples + rightSamples;

//         if (totalSamples > 0) {
//             const leftGini = node.left ? node.left.giniImpurity : 0;
//             const rightGini = node.right ? node.right.giniImpurity : 0;
//             const weightedGini = (leftSamples * leftGini + rightSamples * rightGini) / totalSamples;
//             const giniGain = node.giniImpurity - weightedGini;

//             importance[node.feature] += giniGain * node.samples;
//         }

//         if (node.left) this._calculateFeatureImportance(node.left, importance);
//         if (node.right) this._calculateFeatureImportance(node.right, importance);
//     }

//     printTree(node = null, indent = 0) {
//         if (node === null) node = this.root;
//         if (!node) return;

//         const prefix = "  ".repeat(indent);
//         if (node.isLeaf) {
//             console.log(`${prefix}Leaf: ${node.majorityClass} (${node.samples} samples, Gini: ${node.giniImpurity.toFixed(3)})`);
//         } else {
//             console.log(`${prefix}${node.feature} <= ${node.threshold.toFixed(3)} (${node.samples} samples, Gini: ${node.giniImpurity.toFixed(3)})`);
//             if (node.left) {
//                 console.log(`${prefix}├─ True:`);
//                 this.printTree(node.left, indent + 1);
//             }
//             if (node.right) {
//                 console.log(`${prefix}└─ False:`);
//                 this.printTree(node.right, indent + 1);
//             }
//         }
//     }
// }

// export const transformDecisionTree = (points, options = {}) => {
//     console.log("=== DECISION TREE TRANSFORM START ===");

//     const dt = new DecisionTree({
//         maxDepth: options.maxDepth || 4,
//         minSamplesLeaf: options.minSamplesLeaf || 3,
//         minSamplesSplit: options.minSamplesSplit || 5,
//         maxFeatures: options.maxFeatures || null,
//         centerX: options.centerX || 0,
//         centerY: options.centerY || 0,
//         baseRadius: options.baseRadius || 50
//     });

//     dt.fit(points, options.labelsData);

//     // Enhanced point transformation with proper node assignments
//     const transformedPoints = points.map(point => {
//         const nodeAssignments = getNodeAssignments(point, dt.root);
//         const nodePath = getNodePath(point, dt.root);
//         const decisionPath = dt.getPointsInPath(point);
//         const finalSector = getFinalSector(point, dt.root);
//         const predictedClass = dt.predict([point])[0];

//         return {
//             ...point,
//             predicted_class: predictedClass,
//             nodeAssignments: nodeAssignments,
//             nodePath: nodePath,
//             decisionPath: decisionPath,
//             finalSector: finalSector
//         };
//     });

//     console.log("Sample transformed point:", transformedPoints[0]);

//     return {
//         tree: dt,
//         structure: dt.getCircularTreeStructure(),
//         featureImportance: dt.getFeatureImportance(),
//         transformedPoints: transformedPoints
//     };
// };

// // Enhanced helper function to get node assignments with proper depth mapping
// const getNodeAssignments = (point, root) => {
//     const assignments = [];
//     let currentNode = root;
//     let depth = 0;

//     while (currentNode) {
//         assignments.push({
//             depth: depth,
//             nodeId: currentNode.nodeId,
//             feature: currentNode.feature,
//             threshold: currentNode.threshold,
//             isLeaf: currentNode.isLeaf,
//             sector: currentNode.sector,
//             display: currentNode.isLeaf ?
//                 `Leaf ${currentNode.nodeId}: ${currentNode.majorityClass}` :
//                 `Node ${currentNode.nodeId}: ${currentNode.feature} <= ${currentNode.threshold.toFixed(3)}`
//         });

//         if (currentNode.isLeaf) {
//             break;
//         }

//         const value = point[currentNode.feature];
//         currentNode = value <= currentNode.threshold ? currentNode.left : currentNode.right;
//         depth++;
//     }

//     return assignments;
// };


// const getNodePath = (point, root) => {
//     const path = [];
//     let currentNode = root;

//     while (currentNode && !currentNode.isLeaf) {
//         const value = point[currentNode.feature];
//         const direction = value <= currentNode.threshold ? 'left' : 'right';
//         path.push(`${currentNode.feature} ${direction}`);
//         currentNode = value <= currentNode.threshold ? currentNode.left : currentNode.right;
//     }

//     if (currentNode) {
//         path.push(`→ ${currentNode.majorityClass}`);
//     }

//     return path.join(' → ');
// };

// const getFinalSector = (point, root) => {
//     let currentNode = root;

//     while (currentNode && !currentNode.isLeaf) {
//         const value = point[currentNode.feature];
//         currentNode = value <= currentNode.threshold ? currentNode.left : currentNode.right;
//     }

//     return currentNode ? currentNode.sector : null;
// };

// export default DecisionTree;


import * as d3 from "d3";

class DecisionTreeNode {
    constructor(data, depth = 0, nodeId = 0) {
        this.nodeId = nodeId;
        this.depth = depth;
        this.data = data;
        this.feature = null;
        this.threshold = null;
        this.left = null;
        this.right = null;
        this.isLeaf = false;
        this.giniImpurity = 0;
        this.classCounts = {};
        this.majorityClass = null;
        this.samples = data.length;

        this.sectorIndex = 0;
        this.angle = 0;
        this.startAngle = 0;
        this.endAngle = 0;
        this.radius = 0;
        this.x = 0;
        this.y = 0;
        this.sector = null;
        this.pointsInSector = [];
    }

    calculateClassDistribution(labelsData) {
        this.classCounts = {};

        if (!labelsData || !labelsData.labels) {
            this.classCounts['unlabeled'] = this.data.length;
            this.majorityClass = 'unlabeled';
            return;
        }

        Object.keys(labelsData.labels).forEach(label => {
            this.classCounts[label] = 0;
        });

        this.data.forEach(point => {
            const pointId = point.Point_ID;
            let assigned = false;

            Object.entries(labelsData.labels).forEach(([label, pointList]) => {
                if (Array.isArray(pointList) && pointList.includes(Number(pointId))) {
                    this.classCounts[label]++;
                    assigned = true;
                }
            });

            if (!assigned) {
                if (!this.classCounts['unlabeled']) {
                    this.classCounts['unlabeled'] = 0;
                }
                this.classCounts['unlabeled']++;
            }
        });

        this.majorityClass = Object.entries(this.classCounts)
            .reduce((max, [label, count]) => count > max.count ? { label, count } : max,
                { label: 'unlabeled', count: 0 }).label;
    }

    calculateGiniImpurity() {
        const total = this.samples;
        if (total === 0) {
            this.giniImpurity = 0;
            return 0;
        }

        let gini = 1.0;
        Object.values(this.classCounts).forEach(count => {
            const probability = count / total;
            gini -= probability * probability;
        });

        this.giniImpurity = gini;
        return gini;
    }

    calculateSectorProperties(centerX = 0, centerY = 0, baseRadius = 50) {
        this.radius = baseRadius + (this.depth * 60);

        const midAngle = this.startAngle + (this.angle / 2);
        this.x = centerX + Math.cos(midAngle) * this.radius;
        this.y = centerY + Math.sin(midAngle) * this.radius;

        this.endAngle = this.startAngle + this.angle;

        this.sector = {
            innerRadius: this.depth === 0 ? 0 : baseRadius + ((this.depth - 1) * 60),
            outerRadius: this.radius + 30,
            startAngle: this.startAngle,
            endAngle: this.endAngle,
            centerX: this.x,
            centerY: this.y,
            midAngle: midAngle
        };
    }

    assignPointsToSector(allPoints) {
        this.pointsInSector = [];

        allPoints.forEach(point => {
            if (this.containsPoint(point)) {
                const pointAngle = this.startAngle + (Math.random() * (this.angle || 0.1)); // Fallback angle
                const pointRadius = this.sector.innerRadius + (Math.random() * (this.sector.outerRadius - this.sector.innerRadius));

                const pointData = {
                    ...point,
                    sectorAngle: pointAngle,
                    sectorRadius: pointRadius,
                    sectorX: this.sector.centerX + Math.cos(pointAngle) * pointRadius,
                    sectorY: this.sector.centerY + Math.sin(pointAngle) * pointRadius,
                    nodeId: this.nodeId,
                    depth: this.depth
                };

                this.pointsInSector.push(pointData);
            }
        });
    }

    containsPoint(point) {
        return this.data.some(nodePoint => nodePoint.Point_ID === point.Point_ID);
    }
}

export class DecisionTree {
    constructor(options = {}) {
        this.maxDepth = options.maxDepth || 5;
        this.minSamplesLeaf = options.minSamplesLeaf || 2;
        this.minSamplesSplit = options.minSamplesSplit || 2;
        this.maxFeatures = options.maxFeatures || null;
        this.randomState = options.randomState || 42;
        this.root = null;
        this.nodeCounter = 0;
        this.levels = [];
        this.features = [];

        this.centerX = options.centerX || 0;
        this.centerY = options.centerY || 0;
        this.baseRadius = options.baseRadius || 50;
        this.sectors = [];
        this.allNodes = [];
    }

    fit(data, labelsData = null) {
        console.log("=== DECISION TREE TRAINING START ===");
        console.log(`Training data: ${data.length} points`);

        if (data.length === 0) {
            console.warn("Empty dataset provided. Returning null tree.");
            return this;
        }

        this.features = this._extractFeatures(data);
        console.log(`Available features: ${this.features.join(', ')}`);

        this.levels = [];
        this.nodeCounter = 0;
        this.allNodes = [];

        this.root = this._buildTree(data, labelsData, 0);
        if (!this.root) {
            console.warn("Failed to build decision tree. Root is null.");
            return this;
        }

        this._organizeLevels();
        this._calculateCircularLayout();
        this._assignPointsToSectors(data);

        console.log(`Decision tree built with ${this.levels.length} levels`);
        console.log("=== DECISION TREE TRAINING END ===");

        return this;
    }

    _extractFeatures(data) {
        if (data.length === 0) return [];

        const sample = data[0];
        return Object.keys(sample).filter(key => {
            return key !== 'Point_ID' &&
                !key.endsWith('_binary') &&
                typeof sample[key] === 'number' &&
                !isNaN(sample[key]);
        });
    }

    _buildTree(data, labelsData, depth, parentId = null) {
        if (data.length === 0) return null;

        const nodeId = this.nodeCounter++;
        const node = new DecisionTreeNode(data, depth, nodeId);

        this.allNodes.push(node);

        node.calculateClassDistribution(labelsData);
        node.calculateGiniImpurity();

        console.log(`Node ${nodeId} at depth ${depth}: ${data.length} samples, Gini: ${node.giniImpurity.toFixed(3)}`);

        if (this._shouldStop(node, depth)) {
            node.isLeaf = true;
            console.log(`  -> Leaf node (class: ${node.majorityClass})`);
            return node;
        }

        const bestSplit = this._findBestSplit(data, labelsData);

        if (!bestSplit || bestSplit.giniGain <= 0) {
            node.isLeaf = true;
            console.log(`  -> Leaf node (no good split found)`);
            return node;
        }

        node.feature = bestSplit.feature;
        node.threshold = bestSplit.threshold;

        console.log(`  -> Split on ${bestSplit.feature} <= ${bestSplit.threshold.toFixed(3)} (gain: ${bestSplit.giniGain.toFixed(3)})`);

        const leftData = bestSplit.leftData;
        const rightData = bestSplit.rightData;

        if (leftData.length > 0) {
            node.left = this._buildTree(leftData, labelsData, depth + 1, nodeId);
        }

        if (rightData.length > 0) {
            node.right = this._buildTree(rightData, labelsData, depth + 1, nodeId);
        }

        return node;
    }

    _shouldStop(node, depth) {
        return depth >= this.maxDepth ||
            node.samples < this.minSamplesSplit ||
            node.giniImpurity === 0 ||
            Object.keys(node.classCounts).length <= 1;
    }

    _findBestSplit(data, labelsData) {
        if (data.length === 0) return null;

        let bestSplit = null;
        let bestGiniGain = 0;

        const featuresToConsider = this._selectFeatures();

        featuresToConsider.forEach(feature => {
            const split = this._findBestSplitForFeature(data, labelsData, feature);
            if (split && split.giniGain > bestGiniGain) {
                bestGiniGain = split.giniGain;
                bestSplit = split;
            }
        });

        return bestSplit;
    }

    _selectFeatures() {
        if (this.maxFeatures === null) {
            return [...this.features];
        }

        let numFeatures;
        if (this.maxFeatures === 'sqrt') {
            numFeatures = Math.floor(Math.sqrt(this.features.length));
        } else if (this.maxFeatures === 'log2') {
            numFeatures = Math.floor(Math.log2(this.features.length));
        } else if (typeof this.maxFeatures === 'number') {
            numFeatures = Math.min(this.maxFeatures, this.features.length);
        } else {
            numFeatures = this.features.length;
        }

        const shuffled = [...this.features].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, numFeatures);
    }

    _findBestSplitForFeature(data, labelsData, feature) {
        const values = [...new Set(data.map(point => point[feature]))].sort((a, b) => a - b);

        if (values.length <= 1) return null;

        let bestThreshold = null;
        let bestGiniGain = 0;
        let bestLeftData = null;
        let bestRightData = null;

        for (let i = 0; i < values.length - 1; i++) {
            const threshold = (values[i] + values[i + 1]) / 2;

            const leftData = data.filter(point => point[feature] <= threshold);
            const rightData = data.filter(point => point[feature] > threshold);

            if (leftData.length < this.minSamplesLeaf || rightData.length < this.minSamplesLeaf) {
                continue;
            }

            const giniGain = this._calculateGiniGain(data, leftData, rightData, labelsData);

            if (giniGain > bestGiniGain) {
                bestGiniGain = giniGain;
                bestThreshold = threshold;
                bestLeftData = leftData;
                bestRightData = rightData;
            }
        }

        if (bestThreshold === null) return null;

        return {
            feature,
            threshold: bestThreshold,
            giniGain: bestGiniGain,
            leftData: bestLeftData,
            rightData: bestRightData
        };
    }

    _calculateGiniGain(parentData, leftData, rightData, labelsData) {
        const parentNode = new DecisionTreeNode(parentData);
        parentNode.calculateClassDistribution(labelsData);
        const parentGini = parentNode.calculateGiniImpurity();

        const leftNode = new DecisionTreeNode(leftData);
        leftNode.calculateClassDistribution(labelsData);
        const leftGini = leftNode.calculateGiniImpurity();

        const rightNode = new DecisionTreeNode(rightData);
        rightNode.calculateClassDistribution(labelsData);
        const rightGini = rightNode.calculateGiniImpurity();

        const total = parentData.length;
        const leftWeight = leftData.length / total;
        const rightWeight = rightData.length / total;

        const weightedGini = leftWeight * leftGini + rightWeight * rightGini;
        return parentGini - weightedGini;
    }

    _organizeLevels() {
        this.levels = [];
        this._traverseByLevel(this.root);
        console.log(`Organized ${this.levels.length} levels with node counts: ${this.levels.map(l => l.length).join(', ')}`);
    }

    _traverseByLevel(node) {
        if (!node) return;

        const level = node.depth;
        if (!this.levels[level]) {
            this.levels[level] = [];
        }

        this.levels[level].push(node);

        if (node.left) this._traverseByLevel(node.left);
        if (node.right) this._traverseByLevel(node.right);
    }

    _calculateCircularLayout() {
        if (this.levels.length === 0) {
            console.warn("No levels to calculate layout for.");
            return;
        }

        for (let levelIndex = this.levels.length - 1; levelIndex >= 0; levelIndex--) {
            const nodes = this.levels[levelIndex];
            if (!nodes || nodes.length === 0) {
                console.warn(`No nodes at level ${levelIndex}. Skipping.`);
                continue;
            }

            if (levelIndex === this.levels.length - 1) {
                this._distributeLeafNodes(nodes);
            } else {
                this._calculateInternalNodeAngles(nodes);
            }

            nodes.forEach(node => {
                node.calculateSectorProperties(this.centerX, this.centerY, this.baseRadius);
                if (!node.sector || isNaN(node.sector.centerX) || isNaN(node.sector.centerY)) {
                    console.error(`Invalid sector for node ${node.nodeId} at depth ${node.depth}`);
                }
            });
        }

        this._createSectorArray();
    }

    _distributeLeafNodes(leafNodes) {
        if (leafNodes.length === 0) {
            console.warn("No leaf nodes to distribute.");
            return;
        }

        const totalAngle = 2 * Math.PI;
        const anglePerNode = totalAngle / Math.max(1, leafNodes.length);

        leafNodes.forEach((node, index) => {
            node.startAngle = index * anglePerNode;
            node.angle = anglePerNode;
            node.sectorIndex = index;
        });
    }

    _calculateInternalNodeAngles(nodes) {
        if (nodes.length === 0) return;

        nodes.forEach((node, index) => {
            const children = this._getDirectChildren(node);

            if (children.length === 0) {
                node.angle = 0.1; // Small angle for leaf-like internal nodes
                node.startAngle = index * 0.1;
            } else {
                const childStartAngles = children.map(child => child.startAngle).filter(a => !isNaN(a));
                const childEndAngles = children.map(child => child.startAngle + (child.angle || 0)).filter(a => !isNaN(a));

                if (childStartAngles.length === 0 || childEndAngles.length === 0) {
                    node.startAngle = index * 0.1;
                    node.angle = 0.1;
                } else {
                    node.startAngle = Math.min(...childStartAngles);
                    const endAngle = Math.max(...childEndAngles);
                    node.angle = endAngle - node.startAngle;
                }
            }

            node.sectorIndex = index;
        });
    }

    _getDirectChildren(node) {
        const children = [];
        if (node.left) children.push(node.left);
        if (node.right) children.push(node.right);
        return children;
    }

    _createSectorArray() {
        this.sectors = [];
        this.allNodes.forEach(node => {
            if (node.sector) {
                this.sectors.push({
                    node: node,
                    sector: node.sector,
                    isLeaf: node.isLeaf,
                    depth: node.depth,
                    samples: node.samples,
                    majorityClass: node.majorityClass,
                    giniImpurity: node.giniImpurity,
                    classCounts: node.classCounts
                });
            } else {
                console.warn(`Node ${node.nodeId} at depth ${node.depth} has no sector.`);
            }
        });
        console.log(`Created ${this.sectors.length} sectors.`);
    }

    _assignPointsToSectors(allPoints) {
        this.allNodes.forEach(node => {
            node.assignPointsToSector(allPoints);
            console.log(`Node ${node.nodeId} (depth ${node.depth}): ${node.pointsInSector.length} points assigned.`);
        });
    }

    getPointsInPath(point) {
        const path = [];
        let currentNode = this.root;

        while (currentNode) {
            path.push({
                node: currentNode,
                sector: currentNode.sector,
                isDecisionPoint: !currentNode.isLeaf
            });

            if (currentNode.isLeaf) {
                break;
            }

            const featureValue = point[currentNode.feature];
            if (featureValue === undefined) {
                console.warn(`Feature ${currentNode.feature} not found in point ${point.Point_ID}. Stopping path.`);
                break;
            }
            currentNode = featureValue <= currentNode.threshold ? currentNode.left : currentNode.right;
        }

        return path;
    }

    getSectorConnections() {
        const connections = [];

        this.allNodes.forEach(node => {
            if (!node.isLeaf) {
                const children = this._getDirectChildren(node);
                children.forEach(child => {
                    if (node.sector && child.sector) {
                        connections.push({
                            parent: node.sector,
                            child: child.sector,
                            parentNode: node,
                            childNode: child,
                            feature: node.feature,
                            threshold: node.threshold,
                            direction: child === node.left ? 'left' : 'right'
                        });
                    } else {
                        console.warn(`Missing sector for connection: Node ${node.nodeId} -> Child ${child.nodeId}`);
                    }
                });
            }
        });

        console.log(`Generated ${connections.length} sector connections.`);
        return connections;
    }

    getPointsByLabelInSectors() {
        const labeledSectors = {};

        this.allNodes.forEach(node => {
            if (node.pointsInSector.length > 0) {
                labeledSectors[node.nodeId] = {};

                Object.keys(node.classCounts).forEach(label => {
                    labeledSectors[node.nodeId][label] = node.pointsInSector.filter(point => {
                        return this._getPointLabel(point) === label;
                    });
                });
            }
        });

        return labeledSectors;
    }

    _getPointLabel(point) {
        return point.label || 'unlabeled';
    }

    getCircularTreeStructure() {
        return {
            levels: this.levels,
            sectors: this.sectors,
            connections: this.getSectorConnections(),
            root: this.root,
            allNodes: this.allNodes,
            depth: this.levels.length,
            totalNodes: this.nodeCounter,
            centerX: this.centerX,
            centerY: this.centerY,
            baseRadius: this.baseRadius,
            labeledSectors: this.getPointsByLabelInSectors()
        };
    }

    predict(data) {
        if (!this.root) {
            throw new Error("Decision tree has not been trained yet");
        }

        return data.map(point => this._predictSingle(point, this.root));
    }

    _predictSingle(point, node) {
        if (node.isLeaf) {
            return node.majorityClass;
        }

        if (point[node.feature] === undefined) {
            console.warn(`Feature ${node.feature} not found in point. Returning majority class.`);
            return node.majorityClass;
        }

        if (point[node.feature] <= node.threshold) {
            return node.left ? this._predictSingle(point, node.left) : node.majorityClass;
        } else {
            return node.right ? this._predictSingle(point, node.right) : node.majorityClass;
        }
    }

    getFeatureImportance() {
        const importance = {};
        this.features.forEach(feature => {
            importance[feature] = 0;
        });

        this._calculateFeatureImportance(this.root, importance);

        const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(importance).forEach(feature => {
                importance[feature] /= total;
            });
        }

        return importance;
    }

    _calculateFeatureImportance(node, importance) {
        if (!node || node.isLeaf) return;

        const leftSamples = node.left ? node.left.samples : 0;
        const rightSamples = node.right ? node.right.samples : 0;
        const totalSamples = leftSamples + rightSamples;

        if (totalSamples > 0) {
            const leftGini = node.left ? node.left.giniImpurity : 0;
            const rightGini = node.right ? node.right.giniImpurity : 0;
            const weightedGini = (leftSamples * leftGini + rightSamples * rightGini) / totalSamples;
            const giniGain = node.giniImpurity - weightedGini;

            importance[node.feature] += giniGain * node.samples;
        }

        if (node.left) this._calculateFeatureImportance(node.left, importance);
        if (node.right) this._calculateFeatureImportance(node.right, importance);
    }

    printTree(node = null, indent = 0) {
        if (node === null) node = this.root;
        if (!node) return;

        const prefix = "  ".repeat(indent);
        if (node.isLeaf) {
            console.log(`${prefix}Leaf: ${node.majorityClass} (${node.samples} samples, Gini: ${node.giniImpurity.toFixed(3)})`);
        } else {
            console.log(`${prefix}${node.feature} <= ${node.threshold.toFixed(3)} (${node.samples} samples, Gini: ${node.giniImpurity.toFixed(3)})`);
            if (node.left) {
                console.log(`${prefix}├─ True:`);
                this.printTree(node.left, indent + 1);
            }
            if (node.right) {
                console.log(`${prefix}└─ False:`);
                this.printTree(node.right, indent + 1);
            }
        }
    }
}

export const transformDecisionTree = (points, options = {}) => {
    console.log("=== DECISION TREE TRANSFORM START ===");
    console.log(`Processing ${points.length} points with options:`, options);

    if (!points || points.length === 0) {
        console.error("No points provided for decision tree transformation.");
        return {
            tree: null,
            structure: { levels: [], sectors: [], connections: [], depth: 0, totalNodes: 0 },
            featureImportance: {},
            transformedPoints: []
        };
    }

    const dt = new DecisionTree({
        maxDepth: options.maxDepth || 4,
        minSamplesLeaf: options.minSamplesLeaf || 3,
        minSamplesSplit: options.minSamplesSplit || 5,
        maxFeatures: options.maxFeatures || null,
        centerX: options.centerX || 0,
        centerY: options.centerY || 0,
        baseRadius: options.baseRadius || 50
    });

    dt.fit(points, options.labelsData);

    if (!dt.root) {
        console.error("Decision tree training failed. Returning empty result.");
        return {
            tree: dt,
            structure: { levels: [], sectors: [], connections: [], depth: 0, totalNodes: 0 },
            featureImportance: {},
            transformedPoints: points
        };
    }

    // Enhanced point transformation with proper node assignments
    const transformedPoints = points.map(point => {
        const nodeAssignments = getNodeAssignments(point, dt.root);
        const nodePath = getNodePath(point, dt.root);
        const decisionPath = dt.getPointsInPath(point);
        const finalSector = getFinalSector(point, dt.root);
        const predictedClass = dt.predict([point])[0];

        // Validate nodeAssignments
        if (nodeAssignments.length === 0) {
            console.warn(`No node assignments for point ${point.Point_ID}.`);
        } else {
            nodeAssignments.forEach(assignment => {
                if (!assignment.sector) {
                    console.warn(`Missing sector for node ${assignment.nodeId} in point ${point.Point_ID}.`);
                }
            });
        }

        return {
            ...point,
            predicted_class: predictedClass,
            nodeAssignments: nodeAssignments,
            nodePath: nodePath,
            decisionPath: decisionPath,
            finalSector: finalSector
        };
    });

    console.log("Sample transformed point:", transformedPoints[0] || "No points transformed.");
    console.log(`Transformed ${transformedPoints.length} points with ${dt.levels.length} tree levels.`);

    return {
        tree: dt,
        structure: dt.getCircularTreeStructure(),
        featureImportance: dt.getFeatureImportance(),
        transformedPoints: transformedPoints
    };
};

// Enhanced helper function to get node assignments with proper depth mapping
const getNodeAssignments = (point, root) => {
    const assignments = [];
    let currentNode = root;
    let depth = 0;

    while (currentNode) {
        if (!currentNode.sector) {
            console.warn(`Node ${currentNode.nodeId} at depth ${depth} has no sector.`);
        }

        assignments.push({
            depth: depth,
            nodeId: currentNode.nodeId,
            feature: currentNode.feature,
            threshold: currentNode.threshold,
            isLeaf: currentNode.isLeaf,
            sector: currentNode.sector || {
                innerRadius: 0,
                outerRadius: 50,
                startAngle: 0,
                endAngle: 0.1,
                centerX: 0,
                centerY: 0,
                midAngle: 0
            }, // Fallback sector
            display: currentNode.isLeaf ?
                `Leaf ${currentNode.nodeId}: ${currentNode.majorityClass}` :
                `Node ${currentNode.nodeId}: ${currentNode.feature} <= ${currentNode.threshold?.toFixed(3) || 'N/A'}`
        });

        if (currentNode.isLeaf) {
            break;
        }

        const value = point[currentNode.feature];
        if (value === undefined) {
            console.warn(`Feature ${currentNode.feature} not found in point ${point.Point_ID}.`);
            break;
        }
        currentNode = value <= currentNode.threshold ? currentNode.left : currentNode.right;
        depth++;
    }

    return assignments;
};

const getNodePath = (point, root) => {
    const path = [];
    let currentNode = root;

    while (currentNode && !currentNode.isLeaf) {
        const value = point[currentNode.feature];
        if (value === undefined) {
            console.warn(`Feature ${currentNode.feature} not found in point.`);
            break;
        }
        const direction = value <= currentNode.threshold ? 'left' : 'right';
        path.push(`${currentNode.feature} ${direction}`);
        currentNode = value <= currentNode.threshold ? currentNode.left : currentNode.right;
    }

    if (currentNode) {
        path.push(`→ ${currentNode.majorityClass}`);
    }

    return path.join(' → ');
};

const getFinalSector = (point, root) => {
    let currentNode = root;

    while (currentNode && !currentNode.isLeaf) {
        const value = point[currentNode.feature];
        if (value === undefined) {
            return null;
        }
        currentNode = value <= currentNode.threshold ? currentNode.left : currentNode.right;
    }

    return currentNode ? currentNode.sector : null;
};

export default DecisionTree;