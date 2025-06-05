// DecisionTree.js - Decision Tree implementation for circular visualization
import * as d3 from "d3";

/**
 * Decision Tree Node class
 */
class DecisionTreeNode {
    constructor(data, depth = 0, nodeId = 0) {
        this.nodeId = nodeId;
        this.depth = depth;
        this.data = data; // Points in this node
        this.feature = null; // Feature used for splitting
        this.threshold = null; // Threshold value for splitting
        this.left = null; // Left child (feature <= threshold)
        this.right = null; // Right child (feature > threshold)
        this.isLeaf = false;
        this.giniImpurity = 0;
        this.classCounts = {};
        this.majorityClass = null;
        this.samples = data.length;
        this.sectorIndex = 0; // For circular visualization
        this.angle = 0; // Angle span in circular viz
        this.startAngle = 0; // Starting angle
    }

    /**
     * Calculate class distribution for this node
     */
    calculateClassDistribution(labelsData) {
        this.classCounts = {};

        if (!labelsData || !labelsData.labels) {
            // No labels provided, create single class
            this.classCounts['unlabeled'] = this.data.length;
            this.majorityClass = 'unlabeled';
            return;
        }

        // Initialize all classes
        Object.keys(labelsData.labels).forEach(label => {
            this.classCounts[label] = 0;
        });

        // Count points in each class
        this.data.forEach(point => {
            const pointId = point.Point_ID;
            let assigned = false;

            Object.entries(labelsData.labels).forEach(([label, pointList]) => {
                if (Array.isArray(pointList) && pointList.includes(Number(pointId))) {
                    this.classCounts[label]++;
                    assigned = true;
                }
            });

            // Handle unlabeled points
            if (!assigned) {
                if (!this.classCounts['unlabeled']) {
                    this.classCounts['unlabeled'] = 0;
                }
                this.classCounts['unlabeled']++;
            }
        });

        // Find majority class
        this.majorityClass = Object.entries(this.classCounts)
            .reduce((max, [label, count]) => count > max.count ? { label, count } : max,
                { label: 'unlabeled', count: 0 }).label;
    }

    /**
     * Calculate Gini impurity for this node
     */
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
}

/**
 * Main Decision Tree class
 */
export class DecisionTree {
    constructor(options = {}) {
        this.maxDepth = options.maxDepth || 5;
        this.minSamplesLeaf = options.minSamplesLeaf || 5;
        this.minSamplesSplit = options.minSamplesSplit || 10;
        this.maxFeatures = options.maxFeatures || null; // 'sqrt', 'log2', number, or null for all
        this.randomState = options.randomState || 42;
        this.root = null;
        this.nodeCounter = 0;
        this.levels = []; // Store nodes by level for circular visualization
        this.features = []; // Available features for splitting
    }

    /**
     * Fit the decision tree to the data
     */
    fit(data, labelsData = null) {
        console.log("=== DECISION TREE TRAINING START ===");
        console.log(`Training data: ${data.length} points`);

        // Extract available features (exclude Point_ID and binary features)
        this.features = this._extractFeatures(data);
        console.log(`Available features: ${this.features.join(', ')}`);

        // Initialize levels array
        this.levels = [];
        this.nodeCounter = 0;

        // Build the tree
        this.root = this._buildTree(data, labelsData, 0);

        // Organize nodes by levels for circular visualization
        this._organizeLevels();

        // Calculate angles for circular visualization
        this._calculateAngles();

        console.log(`Decision tree built with ${this.levels.length} levels`);
        console.log("=== DECISION TREE TRAINING END ===");

        return this;
    }

    /**
     * Extract numerical features from data
     */
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

    /**
     * Build decision tree recursively
     */
    _buildTree(data, labelsData, depth, parentId = null) {
        const nodeId = this.nodeCounter++;
        const node = new DecisionTreeNode(data, depth, nodeId);

        // Calculate class distribution and Gini impurity
        node.calculateClassDistribution(labelsData);
        node.calculateGiniImpurity();

        console.log(`Node ${nodeId} at depth ${depth}: ${data.length} samples, Gini: ${node.giniImpurity.toFixed(3)}`);

        // Stopping criteria
        if (this._shouldStop(node, depth)) {
            node.isLeaf = true;
            console.log(`  -> Leaf node (class: ${node.majorityClass})`);
            return node;
        }

        // Find best split
        const bestSplit = this._findBestSplit(data, labelsData);

        if (!bestSplit || bestSplit.giniGain <= 0) {
            node.isLeaf = true;
            console.log(`  -> Leaf node (no good split found)`);
            return node;
        }

        // Apply split
        node.feature = bestSplit.feature;
        node.threshold = bestSplit.threshold;

        console.log(`  -> Split on ${bestSplit.feature} <= ${bestSplit.threshold.toFixed(3)} (gain: ${bestSplit.giniGain.toFixed(3)})`);

        // Create child nodes
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

    /**
     * Check if we should stop splitting
     */
    _shouldStop(node, depth) {
        return depth >= this.maxDepth ||
            node.samples < this.minSamplesSplit ||
            node.giniImpurity === 0 ||
            Object.keys(node.classCounts).length <= 1;
    }

    /**
     * Find the best split for the current node
     */
    _findBestSplit(data, labelsData) {
        if (data.length === 0) return null;

        let bestSplit = null;
        let bestGiniGain = 0;

        // Get features to consider
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

    /**
     * Select features to consider for splitting
     */
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

        // Randomly select features
        const shuffled = [...this.features].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, numFeatures);
    }

    /**
     * Find best split for a specific feature
     */
    _findBestSplitForFeature(data, labelsData, feature) {
        // Get unique values for this feature
        const values = [...new Set(data.map(point => point[feature]))].sort((a, b) => a - b);

        if (values.length <= 1) return null;

        let bestThreshold = null;
        let bestGiniGain = 0;
        let bestLeftData = null;
        let bestRightData = null;

        // Try splits between consecutive values
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

    /**
     * Calculate Gini gain for a split
     */
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

    /**
     * Organize nodes by levels for circular visualization
     */
    _organizeLevels() {
        this.levels = [];
        this._traverseByLevel(this.root);
    }

    /**
     * Traverse tree and organize nodes by level
     */
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

    /**
     * Calculate angles for circular visualization
     */
    _calculateAngles() {
        if (this.levels.length === 0) return;

        // Start with the deepest level and work backwards
        for (let level = this.levels.length - 1; level >= 0; level--) {
            const nodes = this.levels[level];

            if (level === this.levels.length - 1) {
                // Leaf level - distribute evenly
                const anglePerNode = (2 * Math.PI) / nodes.length;
                nodes.forEach((node, index) => {
                    node.startAngle = index * anglePerNode;
                    node.angle = anglePerNode;
                    node.sectorIndex = index;
                });
            } else {
                // Inner levels - base on children
                nodes.forEach((node, index) => {
                    const children = this._getChildren(node);
                    if (children.length === 0) {
                        // No children, assign minimal angle
                        node.angle = 0.1;
                        node.startAngle = index * 0.1;
                        node.sectorIndex = index;
                    } else {
                        // Calculate based on children
                        const childAngles = children.map(child => child.angle);
                        node.angle = childAngles.reduce((sum, angle) => sum + angle, 0);
                        node.startAngle = Math.min(...children.map(child => child.startAngle));
                        node.sectorIndex = index;
                    }
                });

                // Adjust start angles to ensure no overlap
                let currentAngle = 0;
                nodes.forEach(node => {
                    node.startAngle = currentAngle;
                    currentAngle += node.angle;
                });
            }
        }
    }

    /**
     * Get children of a node
     */
    _getChildren(node) {
        const children = [];
        if (node.left) children.push(node.left);
        if (node.right) children.push(node.right);
        return children;
    }

    /**
     * Get tree structure for circular visualization
     */
    getTreeStructure() {
        return {
            levels: this.levels,
            root: this.root,
            depth: this.levels.length,
            totalNodes: this.nodeCounter
        };
    }

    /**
     * Predict class for new data points
     */
    predict(data) {
        if (!this.root) {
            throw new Error("Decision tree has not been trained yet");
        }

        return data.map(point => this._predictSingle(point, this.root));
    }

    /**
     * Predict class for a single data point
     */
    _predictSingle(point, node) {
        if (node.isLeaf) {
            return node.majorityClass;
        }

        if (point[node.feature] <= node.threshold) {
            return node.left ? this._predictSingle(point, node.left) : node.majorityClass;
        } else {
            return node.right ? this._predictSingle(point, node.right) : node.majorityClass;
        }
    }

    /**
     * Get feature importance
     */
    getFeatureImportance() {
        const importance = {};
        this.features.forEach(feature => {
            importance[feature] = 0;
        });

        this._calculateFeatureImportance(this.root, importance);

        // Normalize
        const total = Object.values(importance).reduce((sum, val) => sum + val, 0);
        if (total > 0) {
            Object.keys(importance).forEach(feature => {
                importance[feature] /= total;
            });
        }

        return importance;
    }

    /**
     * Calculate feature importance recursively
     */
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

    /**
     * Print tree structure for debugging
     */
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

    const dt = new DecisionTree({
        maxDepth: options.maxDepth || 5,
        minSamplesLeaf: options.minSamplesLeaf || 5,
        minSamplesSplit: options.minSamplesSplit || 10,
        maxFeatures: options.maxFeatures || null
    });

    dt.fit(points, options.labelsData);

    console.log("Decision tree structure:");
    dt.printTree();

    const treeStructure = dt.getTreeStructure();
    const featureImportance = dt.getFeatureImportance();

    console.log("Feature importance:", featureImportance);
    console.log("=== DECISION TREE TRANSFORM END ===");

    return {
        tree: dt,
        structure: treeStructure,
        featureImportance,
        transformedPoints: points.map(point => ({
            ...point,
            predicted_class: dt.predict([point])[0],
            // Convert nodeAssignments to a simple string or array of strings
            nodeAssignments: getNodeAssignments(point, dt.root),
            // Add a simple node path string for easier rendering
            nodePath: getNodePath(point, dt.root)
        }))
    };
};

// Helper function to get node assignments for a point across all levels
const getNodeAssignments = (point, root) => {
    const assignments = [];
    let currentNode = root;
    let depth = 0;

    while (currentNode && !currentNode.isLeaf) {
        assignments.push({
            depth: depth,
            nodeId: currentNode.nodeId,
            feature: currentNode.feature,
            threshold: currentNode.threshold,
            // Convert to strings to avoid React rendering issues
            display: `Node ${currentNode.nodeId}: ${currentNode.feature} <= ${currentNode.threshold.toFixed(3)}`
        });
        const value = point[currentNode.feature];
        currentNode = value <= currentNode.threshold ? currentNode.left : currentNode.right;
        depth++;
    }

    if (currentNode) {
        assignments.push({
            depth: depth,
            nodeId: currentNode.nodeId,
            feature: null,
            threshold: null,
            isLeaf: true,
            display: `Leaf ${currentNode.nodeId}: ${currentNode.majorityClass}`
        });
    }

    return assignments;
};

// Helper function to get a simple node path string
const getNodePath = (point, root) => {
    const path = [];
    let currentNode = root;

    while (currentNode && !currentNode.isLeaf) {
        const value = point[currentNode.feature];
        const direction = value <= currentNode.threshold ? 'left' : 'right';
        path.push(`${currentNode.feature} ${direction}`);
        currentNode = value <= currentNode.threshold ? currentNode.left : currentNode.right;
    }

    if (currentNode) {
        path.push(`→ ${currentNode.majorityClass}`);
    }

    return path.join(' → ');
};

export default DecisionTree;