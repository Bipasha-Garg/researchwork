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
        this.startAngle = 0;
        this.endAngle = 2 * Math.PI;
        this.angleSpan = 2 * Math.PI;
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

    setSectorAngles(startAngle, endAngle) {
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.angleSpan = endAngle - startAngle;
    }

    assignChildrenSectors() {
        const children = [this.left, this.right].filter(child => child !== null);
        if (children.length === 0) return;

        const anglePerChild = this.angleSpan / children.length;
        children.forEach((child, index) => {
            const childStartAngle = this.startAngle + (index * anglePerChild);
            const childEndAngle = childStartAngle + anglePerChild;
            child.setSectorAngles(childStartAngle, childEndAngle);
        });
    }

    calculateSectorProperties(centerX = 0, centerY = 0, baseRadius = 50, maxRadius = 400, maxDepth) {
        // Dynamically scale radius based on actual depth and maxDepth
        const radiusStep = maxDepth > 0 ? (maxRadius - baseRadius) / (maxDepth + 1) : maxRadius;
        const innerRadius = this.depth === 0 ? 0 : baseRadius + ((this.depth - 1) * radiusStep);
        const outerRadius = baseRadius + (this.depth * radiusStep);

        this.radius = outerRadius;
        const midAngle = this.startAngle + (this.angleSpan / 2);
        const midRadius = (innerRadius + outerRadius) / 2;

        this.x = centerX + Math.cos(midAngle) * midRadius;
        this.y = centerY + Math.sin(midAngle) * midRadius;

        this.sector = {
            innerRadius,
            outerRadius,
            startAngle: this.startAngle,
            endAngle: this.endAngle,
            angleSpan: this.angleSpan,
            centerX: this.x,
            centerY: this.y,
            midAngle,
            midRadius
        };
    }

    assignPointsToSector(allPoints) {
        this.pointsInSector = [];
        allPoints.forEach(point => {
            if (this.containsPoint(point)) {
                const pointData = {
                    ...point,
                    nodeId: this.nodeId,
                    depth: this.depth,
                    sector: this.sector
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
        this.maxFeatures = options.maxFeatures || null;
        this.randomState = options.randomState || 42;
        this.root = null;
        this.nodeCounter = 0;
        this.levels = [];
        this.features = [];
        this.centerX = options.centerX || 0;
        this.centerY = options.centerY || 0;
        this.baseRadius = options.baseRadius || 50;
        this.maxRadius = options.maxRadius || 400;
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

        this._setupHierarchicalSectors();
        this._organizeLevels();
        this._createNodeToSectorMapping();
        // Calculate maxDepth dynamically based on actual tree depth
        const maxDepth = Math.max(...this.allNodes.map(node => node.depth));
        this._calculateCircularLayout(maxDepth);
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

        if (this._shouldStop(node)) {
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

    _shouldStop(node) {
        return node.giniImpurity === 0 || Object.keys(node.classCounts).length <= 1;
    }

    _findBestSplit(data, labelsData) {
        if (data.length === 0) return null;

        let bestSplit = null;
        let bestGiniGain = -Infinity;

        const featuresToConsider = this._selectFeatures();

        featuresToConsider.forEach(feature => {
            const values = data.map(point => point[feature]).filter(val => !isNaN(val)).sort((a, b) => a - b);
            if (values.length === 0) return;

            const thresholds = [];
            for (let i = 1; i < values.length; i++) {
                if (values[i] !== values[i - 1]) {
                    thresholds.push((values[i] + values[i - 1]) / 2);
                }
            }

            thresholds.forEach(threshold => {
                const leftData = data.filter(point => point[feature] <= threshold);
                const rightData = data.filter(point => point[feature] > threshold);

                if (leftData.length === 0 || rightData.length === 0) {
                    return;
                }

                const leftNode = new DecisionTreeNode(leftData, 0);
                const rightNode = new DecisionTreeNode(rightData, 0);

                leftNode.calculateClassDistribution(labelsData);
                rightNode.calculateClassDistribution(labelsData);

                const leftGini = leftNode.calculateGiniImpurity();
                const rightGini = rightNode.calculateGiniImpurity();

                const totalSamples = leftData.length + rightData.length;
                const weightedGini = (leftData.length / totalSamples) * leftGini +
                    (rightData.length / totalSamples) * rightGini;

                const parentNode = new DecisionTreeNode(data, 0);
                parentNode.calculateClassDistribution(labelsData);
                const parentGini = parentNode.calculateGiniImpurity();

                const giniGain = parentGini - weightedGini;

                if (giniGain > bestGiniGain) {
                    bestGiniGain = giniGain;
                    bestSplit = {
                        feature,
                        threshold,
                        giniGain,
                        leftData,
                        rightData
                    };
                }
            });
        });

        return bestSplit;
    }

    _selectFeatures() {
        if (!this.maxFeatures || this.maxFeatures >= this.features.length) {
            return [...this.features];
        }

        const shuffled = [...this.features].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, this.maxFeatures);
    }

    _createNodeToSectorMapping() {
        this.nodeToSectorMap = new Map();
        this.levels.forEach((nodes, depth) => {
            nodes.forEach((node, localIndex) => {
                this.nodeToSectorMap.set(`${node.nodeId}-${depth}`, localIndex);
            });
        });
        console.log('Node to sector mapping created:', this.nodeToSectorMap);
    }

    _setupHierarchicalSectors() {
        if (!this.root) return;
        this.root.setSectorAngles(0, 2 * Math.PI);
        this._assignSectorsRecursively(this.root);
        console.log("Hierarchical sectors assigned successfully");
    }

    _assignSectorsRecursively(node) {
        if (!node || node.isLeaf) return;
        node.assignChildrenSectors();
        if (node.left) this._assignSectorsRecursively(node.left);
        if (node.right) this._assignSectorsRecursively(node.right);
    }

    _organizeLevels() {
        if (!this.root) return;

        this.levels = [];
        const queue = [{ node: this.root, depth: 0 }];
        while (queue.length > 0) {
            const { node, depth } = queue.shift();
            if (!this.levels[depth]) this.levels[depth] = [];
            this.levels[depth].push(node);
            if (node.left) queue.push({ node: node.left, depth: depth + 1 });
            if (node.right) queue.push({ node: node.right, depth: depth + 1 });
        }

        console.log(`Organized levels: ${this.levels.map((level, i) => `Level ${i}: ${level.length} nodes`).join(', ')}`);
    }

    _calculateCircularLayout(maxDepth) {
        if (!this.levels || this.levels.length === 0) return;

        this.sectors = [];
        this.allNodes.forEach(node => {
            node.calculateSectorProperties(this.centerX, this.centerY, this.baseRadius, this.maxRadius, maxDepth);
            this.sectors.push({
                node,
                depth: node.depth,
                samples: node.samples,
                majorityClass: node.majorityClass,
                giniImpurity: node.giniImpurity,
                sector: node.sector,
                startAngle: node.startAngle,
                endAngle: node.endAngle,
                angleSpan: node.angleSpan
            });
        });

        console.log(`Calculated hierarchical layout for ${this.sectors.length} sectors`);
    }

    _assignPointsToSectors(data) {
        this.allNodes.forEach(node => {
            node.assignPointsToSector(data);
        });

        this.transformedPoints = data.map(point => {
            const nodeAssignments = [];
            let currentNode = this.root;
            let depth = 0;

            while (currentNode && !currentNode.isLeaf) {
                const sectorIndex = this.nodeToSectorMap.get(`${currentNode.nodeId}-${currentNode.depth}`) || 0;
                nodeAssignments.push({
                    nodeId: currentNode.nodeId,
                    sectorIndex,
                    depth: currentNode.depth,
                    feature: currentNode.feature,
                    threshold: currentNode.threshold,
                    isLeaf: currentNode.isLeaf,
                    sector: currentNode.sector,
                    startAngle: currentNode.startAngle,
                    endAngle: currentNode.endAngle,
                    angleSpan: currentNode.angleSpan
                });

                if (!currentNode.feature || point[currentNode.feature] === undefined) {
                    break;
                }

                if (point[currentNode.feature] <= currentNode.threshold) {
                    currentNode = currentNode.left;
                } else {
                    currentNode = currentNode.right;
                }
                depth++;
            }

            if (currentNode) {
                const sectorIndex = this.nodeToSectorMap.get(`${currentNode.nodeId}-${currentNode.depth}`) || 0;
                nodeAssignments.push({
                    nodeId: currentNode.nodeId,
                    sectorIndex,
                    depth: currentNode.depth,
                    feature: currentNode.feature,
                    threshold: currentNode.threshold,
                    isLeaf: currentNode.isLeaf,
                    sector: currentNode.sector,
                    startAngle: currentNode.startAngle,
                    endAngle: currentNode.endAngle,
                    angleSpan: currentNode.angleSpan
                });
            }

            return {
                ...point,
                nodeAssignments
            };
        });

        console.log(`Assigned ${this.transformedPoints.length} points to hierarchical sectors`);
    }

    getCircularTreeStructure() {
        if (!this.root) {
            console.warn("No tree available to generate structure.");
            return {
                sectors: [],
                connections: [],
                nodes: []
            };
        }

        const connections = [];
        const nodes = [];

        this.allNodes.forEach(node => {
            nodes.push({
                nodeId: node.nodeId,
                depth: node.depth,
                isLeaf: node.isLeaf,
                feature: node.feature,
                threshold: node.threshold,
                samples: node.samples,
                majorityClass: node.majorityClass,
                giniImpurity: node.giniImpurity,
                sector: node.sector,
                startAngle: node.startAngle,
                endAngle: node.endAngle,
                angleSpan: node.angleSpan
            });

            if (node.left) {
                connections.push({
                    parent: {
                        centerX: node.sector.centerX,
                        centerY: node.sector.centerY,
                        startAngle: node.startAngle,
                        endAngle: node.endAngle
                    },
                    child: {
                        centerX: node.left.sector.centerX,
                        centerY: node.left.sector.centerY,
                        startAngle: node.left.startAngle,
                        endAngle: node.left.endAngle
                    },
                    parentNode: node,
                    childNode: node.left,
                    feature: node.feature,
                    threshold: node.threshold,
                    direction: 'left'
                });
            }

            if (node.right) {
                connections.push({
                    parent: {
                        centerX: node.sector.centerX,
                        centerY: node.sector.centerY,
                        startAngle: node.startAngle,
                        endAngle: node.endAngle
                    },
                    child: {
                        centerX: node.right.sector.centerX,
                        centerY: node.right.sector.centerY,
                        startAngle: node.right.startAngle,
                        endAngle: node.right.endAngle
                    },
                    parentNode: node,
                    childNode: node.right,
                    feature: node.feature,
                    threshold: node.threshold,
                    direction: 'right'
                });
            }
        });

        return {
            sectors: this.sectors,
            connections,
            nodes
        };
    }

    predict(point) {
        if (!this.root) return null;

        let node = this.root;
        while (node && !node.isLeaf) {
            if (!node.feature || point[node.feature] === undefined) {
                break;
            }
            node = point[node.feature] <= node.threshold ? node.left : node.right;
        }
        return node ? node.majorityClass : null;
    }
}

export const transformDecisionTree = (points, options = {}) => {
    console.log("=== TRANSFORM DECISION TREE ===");
    console.log(`Transforming ${points.length} points`);

    const tree = new DecisionTree({
        maxFeatures: options.maxFeatures || null,
        // randomState: options.randomState || 42,
        labelsData: options.labelsData || null,
        centerX: options.centerX || 0,
        centerY: options.centerY || 0,
        // baseRadius: options.baseRadius || 50,
        // maxRadius: options.maxRadius || 400
    });

    tree.fit(points, options.labelsData);

    return {
        tree,
        transformedPoints: tree.transformedPoints || points,
        structure: tree.getCircularTreeStructure()
    };
};