// HierarchicalGraph.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
    CoordinateTransforms, // Will include DECISION_TREE
    transformCoordinates,
    calculateSectorPointCounts,
    calculateProportionalSectorAngles,
    generateRingStructure,
    generateColorSchemes,
    calculatePointPositions,
    // assignSectorIndices, // This was commented out in your original, so keeping it that way
} from "./rB";


const HierarchicalGraph = ({
    jsonData, // For non-DT: { subspaceKey: [points], ... }. For DT: { dataForTree: [all_points] }
    labelsData, // { labels: { className: [pointIDs] } }
    setHoveredCoordinates,
    ringVisibility = {} // Default to empty object for visibility toggles
}) => {
    const graphRef = useRef(null);
    const stripsContainerRef = useRef(null);

    // View and transformation options (from original)
    const [viewMode, setViewMode] = useState("normal");
    const [showEmptySectors, setShowEmptySectors] = useState(true);
    const [transformStrategy, setTransformStrategy] = useState(CoordinateTransforms.POSITIVE_NEGATIVE);
    const [transformOptions, setTransformOptions] = useState({
        threshold: 0,
        percentile: 50,
        // NEW: DT specific options
        maxDepth: 4,
        minSamplesLeaf: 3,
        minSamplesSplit: 5,
        // feature: '' // For Radial, if you had this, keep it
    });

    // Additional state (from original)
    const [selectedPoints, setSelectedPoints] = useState(new Set());
    const [highlightConnections, setHighlightConnections] = useState(true);
    const [animationEnabled, setAnimationEnabled] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    // NEW: State to store full results from DT transformation for UI display
    const [decisionTreeFullDataState, setDecisionTreeFullDataState] = useState(null);


    const isValidData = useCallback(() => { // From original
        return jsonData &&
            typeof jsonData === "object" &&
            Object.keys(jsonData).length > 0; // labelsData is optional for some viz
    }, [jsonData]);

    useEffect(() => { // From original
        if (!isValidData()) {
            console.warn("HierarchicalGraph: Invalid data provided:", { jsonData, labelsData });
            if (graphRef.current) d3.select(graphRef.current).selectAll("*").remove();
            if (stripsContainerRef.current) d3.select(stripsContainerRef.current).selectAll("*").remove();
            return;
        }
        const cleanup = renderVisualization();
        return cleanup;
    }, [
        jsonData, labelsData, ringVisibility, viewMode, showEmptySectors,
        transformStrategy, transformOptions, selectedPoints, highlightConnections,
        animationEnabled, isValidData // Re-render if isValidData changes, though its deps are listed
    ]);

    const renderVisualization = () => {
        console.log("=== RENDER VISUALIZATION START (HierarchicalGraph) ===");
        console.log("Strategy:", transformStrategy, "Options:", transformOptions);

        const svg = d3.select(graphRef.current);
        svg.selectAll("*").remove();

        const componentWidth = graphRef.current ? graphRef.current.clientWidth : 800;
        const componentHeight = graphRef.current ? graphRef.current.clientHeight : 800;

        if (componentWidth === 0 || componentHeight === 0) {
            console.warn("SVG container has zero dimensions. Aborting render.");
            return () => { };
        }

        const margin = 20; // Original margin
        const maxRadius = Math.min(componentWidth, componentHeight) / 2 - margin;

        // Define svgRotationOffset: rotate so 0 rad is at 12 o'clock
        const svgGlobalRotationOffset = -Math.PI / 2;


        svg.attr("width", componentWidth)
            .attr("height", componentHeight)
            // ViewBox centers (0,0) and makes it responsive to width/height attributes
            .attr("viewBox", `${-componentWidth / 2} ${-componentHeight / 2} ${componentWidth} ${componentHeight}`)
            .style("background", "#f0f0f0")
            .style("border", "1px solid #000");

        const g = svg.append("g"); // Main group for content, transformations will be applied here by zoom

        const tooltip = createTooltip(); // From original

        let ringStructure;
        let sectorCounts;
        let dataPointsToDraw = []; // For DT, these are all points. For others, sourced per ring.
        let localDecisionTreeData = null; // Store DT results for this render pass

        // --- Data Preparation based on Strategy ---
        if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
            const dataKeyForTree = Object.keys(jsonData)[0]; // Assume first key has all data for DT
            const pointsForTree = jsonData[dataKeyForTree] || [];
            if (pointsForTree.length > 0) {
                localDecisionTreeData = transformCoordinates(pointsForTree, transformStrategy, {
                    ...transformOptions, // Pass DT hyperparams like maxDepth
                    labelsData         // Pass labelsData for supervised tree building
                });
                setDecisionTreeFullDataState(localDecisionTreeData); // Store in state for UI elements

                if (localDecisionTreeData && localDecisionTreeData.structure && localDecisionTreeData.structure.levels) {
                    // For DT, ring structure is derived from tree levels
                    ringStructure = generateRingStructure(localDecisionTreeData.structure.levels, transformStrategy);
                    dataPointsToDraw = localDecisionTreeData.transformedPoints || []; // All points, enriched by DT
                } else {
                    console.error("Decision Tree transformation failed or returned invalid structure.");
                    ringStructure = [];
                }
            } else {
                console.error("No data provided for Decision Tree strategy under key:", dataKeyForTree);
                ringStructure = [];
            }
        } else {
            // Existing logic for non-DT strategies
            setDecisionTreeFullDataState(null); // Clear DT state if not DT strategy
            ringStructure = generateRingStructure(jsonData, transformStrategy, transformOptions, labelsData);
            // For non-DT, dataPointsToDraw will be implicitly jsonData[ring.key] inside the loop.
        }

        if (!ringStructure || ringStructure.length === 0) {
            console.warn("No ring structure generated. Ending render.");
            g.append("text").text("No data or structure to display.").attr("text-anchor", "middle").attr("fill", "grey");
            return () => { tooltip.remove(); };
        }

        // --- Calculate Sector Counts (handles DT and others via ModularB) ---
        sectorCounts = calculateSectorPointCounts(ringStructure, transformStrategy, transformOptions, labelsData);

        // --- Color Scales (largely from original, with additions for DT node coloring) ---
        const { getRingColor, getSectorColor: getBaseSectorColor } = generateColorSchemes(ringStructure.length);

        const uniqueActualLabels = labelsData && labelsData.labels ? Object.keys(labelsData.labels) : ['unlabeled'];
        const labelColorScale = d3.scaleOrdinal(d3.schemeTableau10).domain(uniqueActualLabels);

        const getPointDisplayLabelColor = (point) => { // For coloring data points themselves
            if (transformStrategy === CoordinateTransforms.DECISION_TREE && point.predicted_class) {
                return labelColorScale(point.predicted_class); // Color by predicted class for DT
            }
            // Original logic for coloring points by actual labels
            if (labelsData && labelsData.labels) {
                const pointId = Array.isArray(point.Point_ID) ? point.Point_ID[0] : point.Point_ID;
                for (const label of uniqueActualLabels) {
                    if ((labelsData.labels[label] || []).includes(Number(pointId))) {
                        return labelColorScale(label);
                    }
                }
            }
            return "#666"; // Default color
        };

        const getSectorVisualFillColor = (ringDataObject, sectorOrNodeIndex, currentRingIndex) => {
            if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
                const node = ringDataObject.points[sectorOrNodeIndex]; // nodes are in ringDataObject.points for DT
                if (!node) return "#f0f0f0"; // Should not happen
                if (node.isLeaf) {
                    return d3.color(labelColorScale(node.majorityClass || 'unlabeled')).brighter(0.3).toString();
                }
                // Color internal nodes by Gini impurity (example)
                const giniColor = d3.scaleSequential(d3.interpolateBlues).domain([0.5, 0]); // More pure = darker
                return giniColor(node.giniImpurity);
            }
            // Fallback to original sector coloring for other strategies
            return getBaseSectorColor(currentRingIndex, sectorOrNodeIndex);
        };

        // --- Calculate Proportional Angles (handles DT and others via ModularB) ---
        const proportionalSectorAngles = viewMode === 'proportional' ?
            calculateProportionalSectorAngles(sectorCounts, showEmptySectors, ringStructure, transformStrategy)
            : null;

        const pointPositionsAcrossAllRings = {}; // To store {x, y, point, ...} for connections

        // --- Main Loop: Render Rings/Levels ---
        ringStructure.forEach((ring, index) => {
            // Visibility check from original (slightly adapted for DT always showing if strategy is DT)
            const isThisRingVisible = ringVisibility[ring.key] !== undefined ? ringVisibility[ring.key] : true;
            if (!isThisRingVisible && transformStrategy !== CoordinateTransforms.DECISION_TREE) return;

            const innerRadius = (index / ringStructure.length) * maxRadius;
            const outerRadius = ((index + 1) / ringStructure.length) * maxRadius;

            // Render Ring Sectors/Nodes
            renderRingSectors(
                g, ring, index, innerRadius, outerRadius,
                getSectorVisualFillColor, // Use the new conditional color function
                sectorCounts[index] || [],
                proportionalSectorAngles ? proportionalSectorAngles[index] : null,
                animationEnabled, svgGlobalRotationOffset, tooltip // Pass svgGlobalRotationOffset
            );

            // Ring Label (from original, adapted for DT)
            let ringLabelText;
            if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
                ringLabelText = `Lvl ${index} (${ring.points.length} Nodes)`;
            } else {
                const defaultRingLabel = String.fromCharCode(65 + index);
                ringLabelText = `${defaultRingLabel} (${(jsonData[ring.key] || []).length} pts) - ${ring.key}`;
            }
            const ringLabel = g.append("text")
                .attr("x", 0)
                .attr("y", -outerRadius - 8) // Adjusted position slightly
                .attr("text-anchor", "middle")
                .attr("font-size", "10px") // Smaller font for labels
                .attr("fill", getRingColor(index))
                .attr("font-weight", "600") // Slightly less bold
                .text(ringLabelText);
            // Animation for label from original
            if (animationEnabled) {
                ringLabel.style("opacity", 0).transition().duration(1000).delay(index * 200).style("opacity", 1);
            }

            // --- Calculate and Render Points for this Ring/Level ---
            let pointsToConsiderForThisRing;
            if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
                pointsToConsiderForThisRing = dataPointsToDraw; // All points, will be filtered by node assignment in calculatePointPositions
            } else {
                pointsToConsiderForThisRing = jsonData[ring.key] || []; // Points specific to this subspace/ring
            }

            if (pointsToConsiderForThisRing.length > 0) {
                const positionsInThisRing = calculatePointPositions(
                    pointsToConsiderForThisRing,
                    index, innerRadius, outerRadius,
                    ring.sectors, // Number of sectors or nodes in this ring/level
                    proportionalSectorAngles ? proportionalSectorAngles[index] : null, // Angular spans
                    viewMode, showEmptySectors, transformStrategy, transformOptions,
                    ring, // The current ring/level object (contains nodes for DT)
                    svgGlobalRotationOffset // Pass global rotation
                );

                (positionsInThisRing || []).forEach(({ point, x, y, sectorIndex, nodeId }, pointRenderIndex) => {
                    const pointIdArray = Array.isArray(point.Point_ID) ? point.Point_ID : [point.Point_ID];
                    const mainPointId = pointIdArray[0];

                    if (!pointPositionsAcrossAllRings[mainPointId]) pointPositionsAcrossAllRings[mainPointId] = [];
                    pointPositionsAcrossAllRings[mainPointId].push({
                        x, y, point,
                        subspaceId: ring.key, // Original key
                        ringIndex: index,
                        sectorIndex,
                        nodeId // Will be undefined for non-DT strategies
                    });

                    drawEnhancedPoint(
                        g, point, x, y, ring, tooltip, labelsData,
                        getPointDisplayLabelColor, // Use the conditional point color func
                        pointRenderIndex, animationEnabled, transformStrategy
                    );
                });
            }
        });

        // --- Draw Connections (Inter-ring for points, or DT Edges) ---
        if (highlightConnections) {
            if (transformStrategy === CoordinateTransforms.DECISION_TREE && localDecisionTreeData && localDecisionTreeData.structure) {
                drawDecisionTreeEdges(g, localDecisionTreeData.structure, maxRadius, ringStructure, svgGlobalRotationOffset, getRingColor);
            } else {
                // Existing logic for point connections across rings
                drawEnhancedConnections(g, pointPositionsAcrossAllRings, getPointDisplayLabelColor, tooltip);
            }
        }

        // --- Zoom Functionality (from original) ---
        const zoomBehavior = d3.zoom()
            .scaleExtent([0.1, 10])
            .on("zoom", (event) => {
                g.attr("transform", event.transform); // Apply zoom transform to the main 'g'
                setZoomLevel(event.transform.k);
            });
        svg.call(zoomBehavior);
        // Optional: set initial transform if you don't want it at 0,0, scale 1
        // svg.call(zoomBehavior.transform, d3.zoomIdentity.translate(initialX, initialY).scale(initialZoom));

        addZoomControls(svg, zoomBehavior, componentWidth, componentHeight); // Pass dimensions for positioning
        renderLinearStrips(ringStructure, sectorCounts, getSectorVisualFillColor); // Pass correct color func

        console.log("=== RENDER VISUALIZATION END (HierarchicalGraph) ===\n");
        return () => { tooltip.remove(); };
    };


    const createTooltip = () => { // From original
        return d3.select("body").append("div")
            .attr("class", "hierarchical-tooltip")
            .style("position", "absolute").style("visibility", "hidden")
            .style("background-color", "rgba(0, 0, 0, 0.85)").style("color", "white")
            .style("padding", "8px 12px").style("border-radius", "6px")
            .style("font-size", "12px").style("font-family", "monospace")
            .style("z-index", "10000").style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)")
            .style("max-width", "300px").style("line-height", "1.4").style("pointer-events", "none");
    };


    const renderRingSectors = ( // Largely from original, adapted for DT nodes and global rotation
        containerG, ringData, ringIdx, innerR, outerR,
        getFillColor, // Function to get sector/node fill color
        countsInSectors, // Array of point counts for opacity or info
        proportionalAngles, // Array of angle spans if proportional view
        isAnimated, svgRotOffset, tip
    ) => {
        const sectorsGroup = containerG.append("g").attr("class", `ring-${ringIdx}-sectors`);

        if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
            // For DT, ringData.points are the DecisionTreeNode objects for this level
            (ringData.points || []).forEach((node, nodeIndexInLevel) => {
                if (node.angle < 0.0001) return; // Skip drawing if node has no angular span

                const startAngleWithOffset = node.startAngle + svgRotOffset;
                const endAngleWithOffset = node.startAngle + node.angle + svgRotOffset;

                const sectorPath = sectorsGroup.append("path")
                    .datum(node) // Attach node data for interactions
                    .attr("d", d3.arc().innerRadius(innerR).outerRadius(outerR)
                        .startAngle(startAngleWithOffset)
                        .endAngle(endAngleWithOffset))
                    .attr("fill", getFillColor(ringData, nodeIndexInLevel, ringIdx)) // getFillColor for node
                    .attr("stroke", "#fff").attr("stroke-width", 0.5)
                    .style("fill-opacity", 0.7) // Default opacity for nodes
                    .on("mouseover", function (event, d_node) {
                        d3.select(this).style("fill-opacity", 0.9);
                        tip.style("visibility", "visible").html(
                            `<strong>Node ${d_node.nodeId} (Lvl ${d_node.depth})</strong><br>` +
                            `Samples: ${d_node.samples}<br>` +
                            `Gini: ${d_node.giniImpurity.toFixed(3)}<br>` +
                            `Majority: ${d_node.majorityClass || 'N/A'}<br>` +
                            (d_node.feature ? `Split: ${d_node.feature} <= ${d_node.threshold.toFixed(2)}` : '<em>Leaf Node</em>')
                        );
                    })
                    .on("mousemove", (event) => tip.style("top", (event.pageY + 10) + "px").style("left", (event.pageX + 10) + "px"))
                    .on("mouseout", function () {
                        d3.select(this).style("fill-opacity", 0.7);
                        tip.style("visibility", "hidden");
                    });
                // Animation from original
                if (isAnimated) sectorPath.style("opacity", 0).transition().duration(800).delay(ringIdx * 100 + nodeIndexInLevel * 30).style("opacity", 1);
            });
        } else if (transformStrategy === CoordinateTransforms.RADIAL) {
            // Original RADIAL sector drawing (a single outline)
            const rotationForRadial = svgRotOffset; // Use global rotation (original used Math.PI/2)
            const ringPath = sectorsGroup.append("path")
                .attr("d", d3.arc().innerRadius(innerR).outerRadius(outerR)
                    .startAngle(rotationForRadial)
                    .endAngle(rotationForRadial + (359 * Math.PI / 180))) // Nearly full circle
                .attr("fill", "none")
                .attr("stroke", getFillColor(ringData, 0, ringIdx)) //Radial has 1 "sector" for color
                .attr("stroke-width", 2).attr("stroke-opacity", 0.5);
            if (isAnimated) ringPath.style("opacity", 0).transition().duration(800).delay(ringIdx * 100).style("opacity", 1);

        } else { // Original logic for 'normal' or 'proportional' sectors (non-DT, non-Radial)
            const numSectorsInRing = ringData.sectors;
            let currentAngleAccumulator = svgRotOffset; // Start with global offset

            const sectorsToRenderIndices = showEmptySectors ?
                Array.from({ length: numSectorsInRing }, (_, i) => i) :
                Array.from({ length: numSectorsInRing }, (_, i) => i).filter(i => (countsInSectors[i] || 0) > 0);

            const anglePerDisplayedSector = (viewMode === 'normal' && !proportionalAngles) ?
                (2 * Math.PI / (showEmptySectors ? numSectorsInRing : sectorsToRenderIndices.length))
                : undefined;

            sectorsToRenderIndices.forEach((sectorIndex, displayOrderIndex) => {
                let startAngle, endAngle;
                if (viewMode === 'proportional' && proportionalAngles && proportionalAngles[sectorIndex] !== undefined) {
                    const angleSpan = proportionalAngles[sectorIndex];
                    if (!showEmptySectors && angleSpan < 0.001) return; // Skip if hidden and tiny
                    startAngle = currentAngleAccumulator;
                    endAngle = currentAngleAccumulator + angleSpan;
                    currentAngleAccumulator = endAngle; // Accumulate for next proportional sector
                } else { // Normal view or proportional fallback if angles not defined
                    const effectiveIndex = showEmptySectors ? sectorIndex : displayOrderIndex;
                    startAngle = (anglePerDisplayedSector * effectiveIndex) + svgRotOffset;
                    endAngle = startAngle + anglePerDisplayedSector;
                }

                if (Math.abs(endAngle - startAngle) < 0.0001) return; // Skip if no angle span

                const sectorPath = sectorsGroup.append("path")
                    .attr("d", d3.arc().innerRadius(innerR).outerRadius(outerR).startAngle(startAngle).endAngle(endAngle))
                    .attr("fill", getFillColor(ringData, sectorIndex, ringIdx))
                    .attr("fill-opacity", (countsInSectors[sectorIndex] || 0) > 0 ? 0.3 : (showEmptySectors ? 0.1 : 0)) // Original opacity logic
                    .style("cursor", "pointer")
                    .on("mouseover", function () { d3.select(this).attr("fill-opacity", 0.6); })
                    .on("mouseout", function () { d3.select(this).attr("fill-opacity", (countsInSectors[sectorIndex] || 0) > 0 ? 0.3 : (showEmptySectors ? 0.1 : 0)); });

                if (isAnimated) sectorPath.style("opacity", 0).transition().duration(800).delay(ringIdx * 100 + displayOrderIndex * 50).style("opacity", 1);
            });
        }
    };


    const drawEnhancedPoint = ( // From original, with color func and strategy passed
        containerG, point, x, y, ringData, tip, labelsDataFromProps,
        getDisplayColorFunc, // Function to get point's fill color
        pointRenderIdx, isAnimated, currentStrategy
    ) => {
        const pointIds = Array.isArray(point.Point_ID) ? point.Point_ID : [point.Point_ID];
        const mainIdForSelection = pointIds[0];
        const isSelected = selectedPoints.has(mainIdForSelection);

        const pointElement = containerG.append("circle")
            .attr("cx", x).attr("cy", y)
            .attr("r", isSelected ? 5 : 3)
            .attr("fill", getDisplayColorFunc(point)) // Use passed color function
            .attr("stroke", isSelected ? "#000" : d3.color(getDisplayColorFunc(point)).darker(0.5)) // Darker stroke
            .attr("stroke-width", isSelected ? 1.5 : 0.5) // Original stroke widths
            .style("pointer-events", "visible").style("cursor", "pointer")
            .on("click", () => { // Original selection logic
                const newSelected = new Set(selectedPoints);
                // Toggle all associated IDs if point represents multiple
                const wasAnySelected = pointIds.some(id => newSelected.has(id));
                if (wasAnySelected) {
                    pointIds.forEach(id => newSelected.delete(id));
                } else {
                    pointIds.forEach(id => newSelected.add(id));
                }
                setSelectedPoints(newSelected);
            })
            .on("mouseover", (event) => { // Original mouseover logic (adapt tooltip content)
                const pointIdsStr = pointIds.join(", ");
                let htmlContent = `<strong>Point ID(s):</strong> ${pointIdsStr}<br>`;

                if (currentStrategy === CoordinateTransforms.DECISION_TREE) {
                    htmlContent += `<strong>Ring/Level:</strong> ${ringData.key} (Node ${point.nodeId || 'N/A'})<br>`;
                    htmlContent += `<strong>Predicted Class:</strong> ${point.predicted_class || "N/A"}<br>`;
                } else {
                    htmlContent += `<strong>Subspace:</strong> ${ringData.key}<br>`;
                    htmlContent += `<strong>Transform:</strong> ${getTransformationInfo(point, currentStrategy)}<br>`;
                }

                // Actual labels from labelsData
                if (labelsDataFromProps && labelsDataFromProps.labels) {
                    let associatedLabels = [];
                    Object.entries(labelsDataFromProps.labels).forEach(([label, pointList]) => {
                        if (pointIds.some(id => (pointList || []).includes(Number(id)))) {
                            associatedLabels.push(label);
                        }
                    });
                    htmlContent += `<strong>Actual Labels:</strong> ${associatedLabels.length > 0 ? associatedLabels.join(", ") : "No Label"}<br>`;
                }
                // Add raw coordinate values (first few)
                Object.entries(point)
                    .filter(([key]) => !["Point_ID", "predicted_class", "nodeAssignments"].some(k => key.includes(k)) && !key.endsWith("_binary"))
                    .slice(0, 3) // Show up to 3 raw features
                    .forEach(([key, val]) => {
                        htmlContent += `${key}: ${typeof val === 'number' ? val.toFixed(2) : val}<br>`;
                    });


                tip.style("visibility", "visible").html(htmlContent);
                if (setHoveredCoordinates) setHoveredCoordinates({ ...point, label: "Hovered Point" }); // Adapt label if needed
                d3.select(event.currentTarget).transition().duration(150).attr("r", isSelected ? 8 : 6);
            })
            .on("mousemove", (event) => tip.style("top", (event.pageY + 10) + "px").style("left", (event.pageX + 10) + "px"))
            .on("mouseout", (event) => { // Original mouseout
                tip.style("visibility", "hidden");
                if (setHoveredCoordinates) setHoveredCoordinates(null);
                d3.select(event.currentTarget).transition().duration(150).attr("r", isSelected ? 5 : 3);
            });

        if (isAnimated) { // Original animation logic
            pointElement.style("opacity", 0).attr("r", 0)
                .transition().duration(600).delay(pointRenderIdx * 10) // Faster delay
                .style("opacity", 1).attr("r", isSelected ? 5 : 3);
        }
    };


    const drawEnhancedConnections = ( // From original, but pass color func
        containerG, pointPosMap, getPtColorFunc, tip
    ) => {
        if (!highlightConnections) return;
        const connectionsGroup = containerG.append("g").attr("class", "connections").lower(); // Draw below points

        Object.entries(pointPosMap).forEach(([pointIdStr, positions]) => {
            if (positions.length > 1) {
                const pointIdNum = Number(pointIdStr); // Ensure numeric for Set.has()
                const isHighlighted = selectedPoints.has(pointIdNum);
                const sortedPositions = positions.sort((a, b) => a.ringIndex - b.ringIndex);

                for (let i = 0; i < sortedPositions.length - 1; i++) {
                    const startPos = sortedPositions[i];
                    const endPos = sortedPositions[i + 1];
                    connectionsGroup.append("line")
                        .attr("x1", startPos.x).attr("y1", startPos.y)
                        .attr("x2", endPos.x).attr("y2", endPos.y)
                        .attr("stroke", isHighlighted ? "orange" : getPtColorFunc(startPos.point)) // Color by point's label/class
                        .attr("stroke-width", isHighlighted ? 2 : 1)
                        .attr("stroke-opacity", isHighlighted ? 0.9 : 0.5) // Adjusted opacity
                        .attr("stroke-dasharray", isHighlighted ? "none" : "2,2")
                        .style("cursor", "pointer") // Original cursor
                        .on("mouseover", (event) => { // Original tooltip for connections
                            tip.style("visibility", "visible").html(
                                `<strong>Connection:</strong> Point ID ${pointIdStr}<br>` +
                                `<strong>Between:</strong> ${startPos.subspaceId} → ${endPos.subspaceId}<br>`
                            );
                            d3.select(event.currentTarget).attr("stroke-width", 3).attr("stroke-opacity", 1);
                        })
                        .on("mousemove", (event) => tip.style("top", (event.pageY + 10) + "px").style("left", (event.pageX + 10) + "px"))
                        .on("mouseout", (event) => {
                            tip.style("visibility", "hidden");
                            d3.select(event.currentTarget).attr("stroke-width", isHighlighted ? 2 : 1)
                                .attr("stroke-opacity", isHighlighted ? 0.9 : 0.5);
                        });
                }
            }
        });
    };

    // NEW: Function to draw edges between Decision Tree nodes
    const drawDecisionTreeEdges = (containerG, treeStructure, maxRad, ringLayout, svgRotOffset, getParentRingColorFunc) => {
        const edgesGroup = containerG.append("g").attr("class", "tree-edges").lower(); // Draw below sectors/points
        if (!treeStructure || !treeStructure.levels || !ringLayout) return;

        treeStructure.levels.forEach((nodesInParentLevel, parentLevelIdx) => {
            if (parentLevelIdx >= treeStructure.levels.length - 1) return; // Last level has no children to draw to

            const parentRingInfo = ringLayout[parentLevelIdx];
            const childRingInfo = ringLayout[parentLevelIdx + 1];
            if (!parentRingInfo || !childRingInfo) return;

            const numTotalLevels = ringLayout.length;
            const pInnerR = (parentLevelIdx / numTotalLevels) * maxRad;
            const pOuterR = ((parentLevelIdx + 1) / numTotalLevels) * maxRad;
            const parentCenterRadius = (pInnerR + pOuterR) / 2;

            const cInnerR = ((parentLevelIdx + 1) / numTotalLevels) * maxRad;
            const cOuterR = ((parentLevelIdx + 2) / numTotalLevels) * maxRad;
            const childCenterRadius = (cInnerR + cOuterR) / 2;

            nodesInParentLevel.forEach(parentNode => {
                if (parentNode.isLeaf || (!parentNode.left && !parentNode.right)) return; // No edges if leaf or no children refs

                // Parent node's angle is 0-2PI relative to 3 o'clock
                const parentBaseAngle = parentNode.startAngle + parentNode.angle / 2; // Center of parent node's arc
                const parentPlotAngle = parentBaseAngle + svgRotOffset; // Apply global rotation
                const parentX = parentCenterRadius * Math.cos(parentPlotAngle);
                const parentY = parentCenterRadius * Math.sin(parentPlotAngle);

                [parentNode.left, parentNode.right].forEach(childNodeReference => {
                    if (childNodeReference) {
                        // Find the actual child node object in the *next level's structure* to get its computed angles
                        const actualChildNode = childRingInfo.points.find(n => n.nodeId === childNodeReference.nodeId);
                        if (actualChildNode && actualChildNode.angle > 0.0001) { // Ensure child has a displayable angle
                            const childBaseAngle = actualChildNode.startAngle + actualChildNode.angle / 2;
                            const childPlotAngle = childBaseAngle + svgRotOffset;
                            const childX = childCenterRadius * Math.cos(childPlotAngle);
                            const childY = childCenterRadius * Math.sin(childPlotAngle);

                            edgesGroup.append("line")
                                .attr("x1", parentX).attr("y1", parentY)
                                .attr("x2", childX).attr("y2", childY)
                                .attr("stroke", getParentRingColorFunc(parentLevelIdx)) // Color by parent ring
                                .attr("stroke-width", 1.5)
                                .attr("stroke-opacity", 0.4);
                        }
                    }
                });
            });
        });
    };


    const addZoomControls = (svgCtrl, zoomBeh, svgW, svgH) => { // From original, adapted for viewBox centering
        const controlsGroup = svgCtrl.append("g").attr("class", "zoom-controls");
        const btnRadius = 15; // Original radius
        const btnYSpacing = 40; // Increased spacing a bit
        // Position controls relative to top-left of viewBox
        const controlsX = -svgW / 2 + btnRadius + 15;
        const controlsYStart = -svgH / 2 + btnRadius + 15;


        // Zoom In
        controlsGroup.append("circle").attr("cx", controlsX).attr("cy", controlsYStart).attr("r", btnRadius)
            .attr("fill", "rgba(255,255,255,0.8)").attr("stroke", "#555").style("cursor", "pointer")
            .on("click", () => svgCtrl.transition().duration(250).call(zoomBeh.scaleBy, 1.4));
        controlsGroup.append("text").attr("x", controlsX).attr("y", controlsYStart).text("+")
            .attr("text-anchor", "middle").attr("dy", "0.35em").style("pointer-events", "none").style("font-weight", "bold");

        // Zoom Out
        controlsGroup.append("circle").attr("cx", controlsX).attr("cy", controlsYStart + btnYSpacing).attr("r", btnRadius)
            .attr("fill", "rgba(255,255,255,0.8)").attr("stroke", "#555").style("cursor", "pointer")
            .on("click", () => svgCtrl.transition().duration(250).call(zoomBeh.scaleBy, 1 / 1.4));
        controlsGroup.append("text").attr("x", controlsX).attr("y", controlsYStart + btnYSpacing).text("−")
            .attr("text-anchor", "middle").attr("dy", "0.35em").style("pointer-events", "none").style("font-weight", "bold").style("font-size", "18px");

        // Reset Zoom
        controlsGroup.append("circle").attr("cx", controlsX).attr("cy", controlsYStart + 2 * btnYSpacing).attr("r", btnRadius)
            .attr("fill", "rgba(255,255,255,0.8)").attr("stroke", "#555").style("cursor", "pointer")
            .on("click", () => svgCtrl.transition().duration(250).call(zoomBeh.transform, d3.zoomIdentity)); // Reset to origin (0,0), scale 1
        controlsGroup.append("text").attr("x", controlsX).attr("y", controlsYStart + 2 * btnYSpacing).text("⌂") // Home icon
            .attr("text-anchor", "middle").attr("dy", "0.35em").style("pointer-events", "none").style("font-size", "14px");
    };


    const renderLinearStrips = (ringStruct, sectorCnts, getSectorNodeFillColorFunc) => { // From original, with color func
        const container = d3.select(stripsContainerRef.current);
        container.selectAll("*").remove();
        if (!ringStruct || ringStruct.length === 0) return;

        ringStruct.forEach((ring, ringIdx) => {
            const isRingStripVisible = ringVisibility[ring.key] !== undefined ? ringVisibility[ring.key] : true;
            if (!isRingStripVisible && transformStrategy !== CoordinateTransforms.DECISION_TREE) return;

            const stripDiv = container.append("div")
                .style("margin-bottom", "15px").style("padding", "8px") // Adjusted padding
                .style("border", "1px solid #ddd").style("border-radius", "4px").style("background-color", "#f9f9f9");

            let titleText;
            if (transformStrategy === CoordinateTransforms.DECISION_TREE) {
                titleText = `Level ${ringIdx}: ${ring.points.length} Nodes`;
            } else {
                const ringIdLabel = String.fromCharCode(65 + ringIdx);
                titleText = `Ring ${ringIdLabel}: ${ring.key} (${(jsonData[ring.key] || []).length} points)`;
            }
            stripDiv.append("h4").style("margin", "0 0 8px 0").style("font-size", "13px").text(titleText);

            const stripSvg = stripDiv.append("svg").attr("width", "100%").attr("height", "50px"); // Increased height
            const stripWidth = stripsContainerRef.current ? stripsContainerRef.current.clientWidth - 20 : 680; // Adjust for padding
            const barAreaHeight = 30; // Max height for bars
            const countsForThisStrip = sectorCnts[ringIdx] || [];
            if (countsForThisStrip.length === 0) return;

            const maxCount = Math.max(...countsForThisStrip, 1); // Avoid division by zero
            const sectorBarWidth = stripWidth / countsForThisStrip.length;

            countsForThisStrip.forEach((count, sectorOrNodeIdx) => {
                const barHeight = (count / maxCount) * barAreaHeight;
                stripSvg.append("rect")
                    .attr("x", sectorOrNodeIdx * sectorBarWidth)
                    .attr("y", barAreaHeight - barHeight + 5) // Position bars at bottom of their area, +5 for text below
                    .attr("width", Math.max(0, sectorBarWidth - 1)) // Ensure non-negative width, -1 for spacing
                    .attr("height", barHeight)
                    .attr("fill", getSectorNodeFillColorFunc(ring, sectorOrNodeIdx, ringIdx)) // Use the main fill color func
                    .attr("stroke", "#777").attr("stroke-width", 0.3);

                stripSvg.append("text")
                    .attr("x", sectorOrNodeIdx * sectorBarWidth + sectorBarWidth / 2)
                    .attr("y", barAreaHeight + 15) // Text below bars
                    .attr("text-anchor", "middle").style("font-size", "9px")
                    .text(count);
            });
        });
    };


    const getTransformationInfo = (pointData, strategy) => { // From original
        if (strategy === CoordinateTransforms.RADIAL) {
            const feature = Object.keys(pointData).find(key => key !== 'Point_ID' && typeof pointData[key] === 'number' && key !== 'angle');
            const angle = pointData.angle !== undefined ? (pointData.angle * 180 / Math.PI).toFixed(1) : 'N/A';
            return `Radial (Feature: ${feature || 'N/A'}, Angle: ${angle}°)`;
        }
        const coords = Object.entries(pointData).filter(([key]) => key !== "Point_ID" && !key.includes("nodeAssignments") && !key.includes("predicted_class"));
        const values = coords.filter(([k, v]) => typeof v === 'number' || k.endsWith('_binary')) // Show numeric or binary
            .slice(0, 3).map(([k, val]) => `${k.replace('_binary', '')}:${typeof val === 'number' ? val.toFixed(1) : val}`).join(", ");
        const stratName = strategy.replace('_', ' ').toLowerCase();
        return `${stratName} (${values}${coords.length > 3 ? '...' : ''})`;
    };


    const handleTransformOptionChange = (key, value) => { // From original, ensuring numeric conversion
        setTransformOptions(prev => ({
            ...prev,
            [key]: (key.includes('Depth') || key.includes('Samples')) ? (parseInt(value) || 0) : (parseFloat(value) || 0)
        }));
    };

    // --- JSX Structure (largely from original, with DT option added) ---
    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", boxSizing: 'border-box', padding: '10px' }}>
            {/* Control Panel (enhanced styles from previous full code for better look) */}
            <div style={{ marginBottom: "15px", padding: "12px", backgroundColor: "#f0f3f5", borderRadius: "6px", border: "1px solid #d1d9e0", fontSize: "12px" }}>
                <div style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
                    <strong style={{ marginRight: "8px" }}>View Mode:</strong>
                    {['normal', 'proportional'].map(mode => (
                        <button key={mode} onClick={() => setViewMode(mode)}
                            style={{
                                marginRight: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer",
                                backgroundColor: viewMode === mode ? "#0069d9" : "#e9ecef",
                                color: viewMode === mode ? "white" : "#343a40",
                                border: `1px solid ${viewMode === mode ? "#005cbf" : "#ced4da"}`, borderRadius: "3px"
                            }}>
                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                        </button>
                    ))}
                </div>
                <div style={{ marginBottom: "10px", display: "flex", alignItems: "center" }}>
                    <strong style={{ marginRight: "8px" }}>Options:</strong>
                    {[
                        { state: showEmptySectors, setter: setShowEmptySectors, label: 'Empty Sectors' },
                        { state: highlightConnections, setter: setHighlightConnections, label: 'Connections' },
                        // { state: animationEnabled, setter: setAnimationEnabled, label: 'Animations' } // Can re-enable if animations are polished
                    ].map(({ state, setter, label }) => (
                        <button key={label} onClick={() => setter(!state)}
                            style={{
                                marginRight: "5px", padding: "5px 10px", fontSize: "11px", cursor: "pointer",
                                backgroundColor: state ? "#218838" : "#5a6268", color: "white",
                                border: "none", borderRadius: "3px"
                            }}>
                            {state ? '✓' : '✗'} {label}
                        </button>
                    ))}
                </div>
                <div style={{ marginBottom: "5px", display: "flex", alignItems: "center", flexWrap: "wrap" }}>
                    <strong style={{ marginRight: "8px" }}>Coord Transform:</strong>
                    <select value={transformStrategy} onChange={(e) => setTransformStrategy(e.target.value)}
                        style={{ padding: "5px", fontSize: "11px", borderRadius: "3px", border: "1px solid #ced4da", marginRight: "10px" }}>
                        {Object.entries(CoordinateTransforms).map(([key, value]) => (
                            <option key={value} value={value}>
                                {value.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                            </option>
                        ))}
                    </select>

                    {/* Conditional Options based on strategy (from original) */}
                    {(transformStrategy === CoordinateTransforms.Z_SCORE || transformStrategy === CoordinateTransforms.CUSTOM_THRESHOLD) && (
                        <label style={{ fontSize: "11px", marginRight: "10px" }}> Threshold:
                            <input type="number" step="0.1" value={transformOptions.threshold}
                                onChange={(e) => handleTransformOptionChange('threshold', e.target.value)}
                                style={{ marginLeft: "5px", width: "50px", padding: "4px", fontSize: "11px", borderRadius: "3px", border: "1px solid #ccc" }} />
                        </label>
                    )}
                    {transformStrategy === CoordinateTransforms.PERCENTILE && (
                        <label style={{ fontSize: "11px", marginRight: "10px" }}> Percentile:
                            <input type="number" min="0" max="100" value={transformOptions.percentile}
                                onChange={(e) => handleTransformOptionChange('percentile', e.target.value)}
                                style={{ marginLeft: "5px", width: "50px", padding: "4px", fontSize: "11px", borderRadius: "3px", border: "1px solid #ccc" }} />
                        </label>
                    )}
                    {/* NEW: Decision Tree Specific Options */}
                    {transformStrategy === CoordinateTransforms.DECISION_TREE && (
                        <span style={{ fontSize: "11px" }}>
                            <label style={{ marginRight: "5px" }}>Max Depth: <input type="number" min="1" value={transformOptions.maxDepth} onChange={e => handleTransformOptionChange('maxDepth', e.target.value)} style={{ width: "40px", padding: "3px", fontSize: "11px", borderRadius: "3px", border: "1px solid #ccc" }} /></label>
                            <label style={{ marginRight: "5px" }}>Min Leaf: <input type="number" min="1" value={transformOptions.minSamplesLeaf} onChange={e => handleTransformOptionChange('minSamplesLeaf', e.target.value)} style={{ width: "40px", padding: "3px", fontSize: "11px", borderRadius: "3px", border: "1px solid #ccc" }} /></label>
                            <label>Min Split: <input type="number" min="2" value={transformOptions.minSamplesSplit} onChange={e => handleTransformOptionChange('minSamplesSplit', e.target.value)} style={{ width: "40px", padding: "3px", fontSize: "11px", borderRadius: "3px", border: "1px solid #ccc" }} /></label>
                        </span>
                    )}
                </div>
                {/* Status Info (from original, with DT feature importance) */}
                <div style={{ fontSize: "10px", color: "#555", marginTop: "8px" }}>
                    Selected Points: {selectedPoints.size} | Zoom: {(zoomLevel * 100).toFixed(0)}%
                    {transformStrategy === CoordinateTransforms.DECISION_TREE && decisionTreeFullDataState && decisionTreeFullDataState.featureImportance && (
                        <span style={{ marginLeft: "15px" }}>DT Feat. Import.: {
                            Object.entries(decisionTreeFullDataState.featureImportance)
                                .filter(([, val]) => val > 0.001) // Show if some importance
                                .sort(([, a], [, b]) => b - a) // Sort by importance desc
                                .slice(0, 3) // Top 3
                                .map(([k, v]) => `${k}:${v.toFixed(2)}`).join(', ')
                        }
                            {Object.entries(decisionTreeFullDataState.featureImportance).filter(([, val]) => val > 0.001).length > 3 ? '...' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Main Visualization SVG container */}
            <div style={{ flexGrow: 1, position: "relative", border: "1px solid #ccc", borderRadius: "4px", overflow: "hidden", minHeight: "500px" }}>
                <svg ref={graphRef} style={{ width: "100%", height: "100%" }}></svg>
            </div>

            {/* Linear Strip Visualizations container */}
            <div style={{ marginTop: "15px" }}>
                <h4 style={{ fontSize: "14px", marginBottom: "8px", color: "#333" }}>Linear View of Rings/Levels</h4>
                <div ref={stripsContainerRef}
                    style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #ddd", borderRadius: "4px", padding: "10px", backgroundColor: "#fdfdfd" }}>
                </div>
            </div>
        </div>
    );
};

export default HierarchicalGraph;