// // HierarchicalGraph.js - Main visualization component with configurable options

// import React, { useEffect, useRef, useState } from "react";
// import * as d3 from "d3";
// import {
//     CoordinateTransforms,
//     transformCoordinates,
//     calculateSectorPointCounts,
//     calculateProportionalSectorAngles,
//     generateRingStructure,
//     generateColorSchemes,
//     calculatePointPositions
// } from "./ModularB";

// const HierarchicalGraph = ({
//     jsonData,
//     labelsData,
//     setHoveredCoordinates,
//     ringVisibility
// }) => {
//     const graphRef = useRef(null);
//     const stripsContainerRef = useRef(null);

//     // View and transformation options
//     const [viewMode, setViewMode] = useState("normal");
//     const [showEmptySectors, setShowEmptySectors] = useState(true);
//     const [transformStrategy, setTransformStrategy] = useState(CoordinateTransforms.POSITIVE_NEGATIVE);
//     const [transformOptions, setTransformOptions] = useState({
//         threshold: 0,
//         percentile: 50
//     });

//     // Validation
//     useEffect(() => {
//         if (!jsonData || typeof jsonData !== "object" || Object.keys(jsonData).length === 0) {
//             console.error("Invalid or empty jsonData:", jsonData);
//             return;
//         }

//         if (!labelsData || typeof labelsData !== "object") {
//             console.error("Invalid labelsData:", labelsData);
//             return;
//         }

//         renderVisualization();
//     }, [
//         jsonData,
//         labelsData,
//         ringVisibility,
//         setHoveredCoordinates,
//         viewMode,
//         showEmptySectors,
//         transformStrategy,
//         transformOptions
//     ]);
// // Add this debugging code to your renderVisualization function

// const renderVisualization = () => {
//     console.log("=== RENDER VISUALIZATION START ===");
//     console.log("Transform Strategy:", transformStrategy);
//     console.log("Transform Options:", transformOptions);
    
//     const svg = d3.select(graphRef.current);
//     svg.selectAll("*").remove();

//     const width = 800;
//     const height = 800;
//     const margin = 20;
//     const maxRadius = Math.min(width, height) / 2 - margin;

//     const g = svg
//         .attr("width", width)
//         .attr("height", height)
//         .append("g")
//         .attr("transform", `translate(${width / 2}, ${height / 2})`);

//     // Create tooltip
//     const tooltip = createTooltip();

//     // Generate ring structure and colors
//     const ringStructure = generateRingStructure(jsonData);
//     console.log("Ring Structure:", ringStructure);
    
//     const { getRingColor, getSectorColor } = generateColorSchemes(ringStructure.length);

//     // Create label color function
//     const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
//         .domain(Object.keys(labelsData.labels || {}));

//     const getLabelColor = (pointId) => {
//         if (!labelsData || !labelsData.labels) return "gray";
//         for (const label of Object.keys(labelsData.labels)) {
//             const pointList = labelsData.labels[label];
//             if (Array.isArray(pointList) && pointList.includes(Number(pointId))) {
//                 return colorScale(label);
//             }
//         }
//         return "gray";
//     };

//     // Calculate sector counts and angles
//     const sectorCounts = calculateSectorPointCounts(ringStructure, transformStrategy, transformOptions);
//     console.log("Sector Counts:", sectorCounts);
    
//     const sectorAngles = viewMode === 'proportional' ?
//         calculateProportionalSectorAngles(sectorCounts, showEmptySectors) : null;
//     console.log("Sector Angles:", sectorAngles);

//     // Store point positions for connections
//     const pointPositions = {};
//     const ringLabels = ringStructure.map((_, i) => String.fromCharCode(65 + i));

//     // Debug: Track total points processed
//     let totalPointsProcessed = 0;
//     let totalPointsExpected = 0;

//     // Render rings and points
//     ringStructure.forEach((ring, index) => {
//         if (!ringVisibility[ring.key]) return;

//         console.log(`\n--- Processing Ring ${index} (${ring.key}) ---`);
//         console.log("Ring points count:", ring.points.length);
//         totalPointsExpected += ring.points.length;

//         const innerRadius = (index / ringStructure.length) * maxRadius;
//         const outerRadius = ((index + 1) / ringStructure.length) * maxRadius;

//         // Render ring sectors
//         renderRingSectors(
//             g,
//             ring,
//             index,
//             innerRadius,
//             outerRadius,
//             getSectorColor,
//             sectorCounts[index],
//             sectorAngles ? sectorAngles[index] : null
//         );

//         // Add ring label
//         g.append("text")
//             .attr("x", 0)
//             .attr("y", -outerRadius - 5)
//             .attr("text-anchor", "middle")
//             .attr("font-size", "16px")
//             .attr("fill", "red")
//             .attr("font-weight", "bold")
//             .text(ringLabels[index]);

//         // Calculate and render points
//         const positions = calculatePointPositions(
//             ring.points,
//             index,
//             innerRadius,
//             outerRadius,
//             ring.sectors,
//             sectorAngles ? sectorAngles[index] : null,
//             viewMode,
//             showEmptySectors,
//             transformStrategy,
//             transformOptions
//         );

//         console.log(`Positions calculated for ring ${index}:`, positions.length);
//         console.log("First few positions:", positions.slice(0, 3).map(p => ({
//             pointId: p.point.Point_ID,
//             x: p.x,
//             y: p.y,
//             originalData: Object.entries(p.point).filter(([key]) => key !== "Point_ID")
//         })));

//         positions.forEach(({ point, x, y }) => {
//             totalPointsProcessed++;
            
//             // Store position for connections
//             point.Point_ID.forEach((id) => {
//                 if (!pointPositions[id]) {
//                     pointPositions[id] = [];
//                 }
//                 pointPositions[id].push({ x, y, point, subspaceId: ring.key });
//             });

//             // Draw point
//             drawPoint(g, point, x, y, ring, tooltip, labelsData);
//         });
//     });

//     console.log(`\n=== SUMMARY ===`);
//     console.log("Total points expected:", totalPointsExpected);
//     console.log("Total points processed:", totalPointsProcessed);
//     console.log("Points with connections:", Object.keys(pointPositions).length);

//     // Draw connections between points
//     drawConnections(g, pointPositions, getLabelColor, tooltip);

//     // Add zoom functionality
//     const zoom = d3.zoom().on("zoom", (event) => {
//         g.attr("transform", event.transform);
//     });
//     svg.call(zoom);

//     console.log("=== RENDER VISUALIZATION END ===\n");

//     // Cleanup function
//     return () => {
//         tooltip.remove();
//     };
// };
   
//     const createTooltip = () => {
//         return d3
//             .select("body")
//             .append("div")
//             .attr("class", "tooltip")
//             .style("position", "absolute")
//             .style("visibility", "hidden")
//             .style("background-color", "rgba(0, 0, 0, 0.7)")
//             .style("color", "white")
//             .style("padding", "5px")
//             .style("border-radius", "4px")
//             .style("font-size", "12px")
//             .style("z-index", "1000");
//     };

//     const renderRingSectors = (
//         g,
//         ring,
//         ringIndex,
//         innerRadius,
//         outerRadius,
//         getSectorColor,
//         sectorCounts,
//         sectorAngles
//     ) => {
//         const rotationOffset = Math.PI / 2;

//         if (viewMode === 'normal') {
//             const sectorsToRender = showEmptySectors ?
//                 Array.from({ length: ring.sectors }, (_, i) => i) :
//                 Array.from({ length: ring.sectors }, (_, i) => i).filter(i => sectorCounts[i] > 0);

//             const anglePerSector = 2 * Math.PI / (showEmptySectors ? ring.sectors : sectorsToRender.length);

//             sectorsToRender.forEach((sectorIndex, displayIndex) => {
//                 const actualIndex = showEmptySectors ? sectorIndex : displayIndex;
//                 const startAngle = (anglePerSector * actualIndex) + rotationOffset;
//                 const endAngle = (anglePerSector * (actualIndex + 1)) + rotationOffset;

//                 g.append("path")
//                     .attr("d", d3.arc()
//                         .innerRadius(innerRadius)
//                         .outerRadius(outerRadius)
//                         .startAngle(startAngle)
//                         .endAngle(endAngle)
//                     )
//                     .attr("fill", getSectorColor(ringIndex, sectorIndex))
//                     .attr("fill-opacity", 0.3)
//                     .attr("stroke", "black")
//                     .attr("stroke-width", 0.5)
//                     .style("cursor", "pointer");
//             });
//         } else if (viewMode === 'proportional' && sectorAngles) {
//             let currentAngle = rotationOffset;

//             sectorAngles.forEach((angle, sectorIndex) => {
//                 if (!showEmptySectors && angle === 0) return;

//                 const startAngle = currentAngle;
//                 const endAngle = currentAngle + angle;

//                 g.append("path")
//                     .attr("d", d3.arc()
//                         .innerRadius(innerRadius)
//                         .outerRadius(outerRadius)
//                         .startAngle(startAngle)
//                         .endAngle(endAngle)
//                     )
//                     .attr("fill", getSectorColor(ringIndex, sectorIndex))
//                     .attr("fill-opacity", 0.3)
//                     .attr("stroke", "black")
//                     .attr("stroke-width", 0.3)
//                     .style("cursor", "pointer");

//                 currentAngle = endAngle;
//             });
//         }
//     };

//     const drawPoint = (g, point, x, y, ring, tooltip, labelsData) => {
//         g.append("circle")
//             .attr("cx", x)
//             .attr("cy", y)
//             .attr("r", 3)
//             .attr("fill", "black")
//             .attr("stroke", "white")
//             .attr("stroke-width", 0.5)
//             .style("pointer-events", "visible")
//             .on("mouseover", (event) => {
//                 const pointIds = point.Point_ID.join(", ");
//                 let associatedLabels = [];

//                 if (labelsData && labelsData.labels) {
//                     Object.entries(labelsData.labels).forEach(([label, pointList]) => {
//                         if (point.Point_ID.some(id => pointList.includes(Number(id)))) {
//                             associatedLabels.push(label);
//                         }
//                     });
//                 }

//                 const labelText = associatedLabels.length > 0 ? associatedLabels.join(", ") : "No Label";
//                 const transformInfo = getTransformationInfo(point);

//                 tooltip
//                     .style("visibility", "visible")
//                     .html(
//                         `Point_IDs: ${pointIds}<br>` +
//                         `Coordinates: (${x.toFixed(2)}, ${y.toFixed(2)})<br>` +
//                         `Subspace: ${ring.key}<br>` +
//                         `Label: ${labelText}<br>` +
//                         `Transform: ${transformInfo}`
//                     );

//                 setHoveredCoordinates({ ...point, label: labelText });
//             })
//             .on("mousemove", (event) => {
//                 tooltip
//                     .style("top", event.pageY + 10 + "px")
//                     .style("left", event.pageX + 10 + "px");
//             })
//             .on("mouseout", () => {
//                 tooltip.style("visibility", "hidden");
//                 setHoveredCoordinates(null);
//             });
//     };

//     const drawConnections = (g, pointPositions, getLabelColor, tooltip) => {
//         Object.entries(pointPositions).forEach(([pointId, positions]) => {
//             if (positions.length > 1) {
//                 for (let i = 0; i < positions.length - 1; i++) {
//                     g.append("line")
//                         .attr("x1", positions[i].x)
//                         .attr("y1", positions[i].y)
//                         .attr("x2", positions[i + 1].x)
//                         .attr("y2", positions[i + 1].y)
//                         .attr("stroke", getLabelColor(pointId))
//                         .attr("stroke-width", 0.7)
//                         .attr("stroke-opacity", 0.9)
//                         .style("cursor", "pointer")
//                         .on("mouseover", (event) => {
//                             tooltip
//                                 .style("visibility", "visible")
//                                 .html(`Connection: Point_ID ${pointId}`);
//                         })
//                         .on("mousemove", (event) => {
//                             tooltip
//                                 .style("top", event.pageY + 10 + "px")
//                                 .style("left", event.pageX + 10 + "px");
//                         })
//                         .on("mouseout", () => {
//                             tooltip.style("visibility", "hidden");
//                         });
//                 }
//             }
//         });
//     };

//     const getTransformationInfo = (point) => {
//         const coords = Object.entries(point).filter(([key]) => key !== "Point_ID");
//         const values = coords.map(([_, val]) => val).join(", ");
//         return `${transformStrategy} (${values})`;
//     };

//     const handleTransformOptionChange = (key, value) => {
//         setTransformOptions(prev => ({
//             ...prev,
//             [key]: parseFloat(value) || 0
//         }));
//     };

//     return (
//         <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
//             {/* Control Panel */}
//             <div style={{ marginBottom: "20px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
//                 {/* View Mode Controls */}
//                 <div style={{ marginBottom: "10px" }}>
//                     <strong>View Mode:</strong>
//                     <button
//                         onClick={() => setViewMode("normal")}
//                         style={{
//                             marginLeft: "10px",
//                             padding: "5px 10px",
//                             backgroundColor: viewMode === "normal" ? "#4CAF50" : "#f0f0f0",
//                             color: viewMode === "normal" ? "white" : "black",
//                             border: "1px solid #ccc",
//                             borderRadius: "4px",
//                             cursor: "pointer"
//                         }}
//                     >
//                         Normal View
//                     </button>
//                     <button
//                         onClick={() => setViewMode("proportional")}
//                         style={{
//                             marginLeft: "5px",
//                             padding: "5px 10px",
//                             backgroundColor: viewMode === "proportional" ? "#4CAF50" : "#f0f0f0",
//                             color: viewMode === "proportional" ? "white" : "black",
//                             border: "1px solid #ccc",
//                             borderRadius: "4px",
//                             cursor: "pointer"
//                         }}
//                     >
//                         Proportional View
//                     </button>
//                     <button
//                         onClick={() => setShowEmptySectors(!showEmptySectors)}
//                         style={{
//                             marginLeft: "10px",
//                             padding: "5px 10px",
//                             backgroundColor: showEmptySectors ? "#2196F3" : "#ff9800",
//                             color: "white",
//                             border: "1px solid #ccc",
//                             borderRadius: "4px",
//                             cursor: "pointer"
//                         }}
//                     >
//                         {showEmptySectors ? "Hide Empty Sectors" : "Show Empty Sectors"}
//                     </button>
//                 </div>

//                 {/* Transformation Strategy Controls */}
//                 <div style={{ marginBottom: "10px" }}>
//                     <strong>Coordinate Transform:</strong>
//                     <select
//                         value={transformStrategy}
//                         onChange={(e) => setTransformStrategy(e.target.value)}
//                         style={{
//                             marginLeft: "10px",
//                             padding: "5px",
//                             borderRadius: "4px",
//                             border: "1px solid #ccc"
//                         }}
//                     >
//                         <option value={CoordinateTransforms.POSITIVE_NEGATIVE}>Positive/Negative</option>
//                         <option value={CoordinateTransforms.Z_SCORE}>Z-Score</option>
//                         <option value={CoordinateTransforms.PERCENTILE}>Percentile</option>
//                         <option value={CoordinateTransforms.CUSTOM_THRESHOLD}>Custom Threshold</option>
//                     </select>

//                     {/* Transform-specific options */}
//                     {(transformStrategy === CoordinateTransforms.Z_SCORE ||
//                         transformStrategy === CoordinateTransforms.CUSTOM_THRESHOLD) && (
//                             <>
//                                 <label style={{ marginLeft: "10px" }}>
//                                     Threshold:
//                                     <input
//                                         type="number"
//                                         step="0.1"
//                                         value={transformOptions.threshold}
//                                         onChange={(e) => handleTransformOptionChange('threshold', e.target.value)}
//                                         style={{ marginLeft: "5px", width: "60px", padding: "2px" }}
//                                     />
//                                 </label>
//                             </>
//                         )}

//                     {transformStrategy === CoordinateTransforms.PERCENTILE && (
//                         <label style={{ marginLeft: "10px" }}>
//                             Percentile:
//                             <input
//                                 type="number"
//                                 min="0"
//                                 max="100"
//                                 value={transformOptions.percentile}
//                                 onChange={(e) => handleTransformOptionChange('percentile', e.target.value)}
//                                 style={{ marginLeft: "5px", width: "60px", padding: "2px" }}
//                             />
//                         </label>
//                     )}
//                 </div>
//             </div>

//             {/* Circular visualization */}
//             <svg ref={graphRef} style={{ width: "100%", height: "800px" }}></svg>

//             {/* Linear strip visualizations with scrolling */}
//             <div style={{ marginTop: "20px" }}>
//                 <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Linear Strip Visualizations</h2>
//                 <div
//                     ref={stripsContainerRef}
//                     style={{
//                         maxHeight: "500px",
//                         overflowY: "auto",
//                         border: "1px solid #ddd",
//                         borderRadius: "4px",
//                         padding: "10px"
//                     }}
//                 ></div>
//             </div>
//         </div>
//     );
// };

// export default HierarchicalGraph;


// HierarchicalGraph.js - Enhanced main visualization component with improved features

import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
    CoordinateTransforms,
    transformCoordinates,
    calculateSectorPointCounts,
    calculateProportionalSectorAngles,
    generateRingStructure,
    generateColorSchemes,
    calculatePointPositions
} from "./ModularB";

const HierarchicalGraph = ({
    jsonData,
    labelsData,
    setHoveredCoordinates,
    ringVisibility
}) => {
    const graphRef = useRef(null);
    const stripsContainerRef = useRef(null);

    // View and transformation options
    const [viewMode, setViewMode] = useState("normal");
    const [showEmptySectors, setShowEmptySectors] = useState(true);
    const [transformStrategy, setTransformStrategy] = useState(CoordinateTransforms.POSITIVE_NEGATIVE);
    const [transformOptions, setTransformOptions] = useState({
        threshold: 0,
        percentile: 50,
        maxDepth: 10 // For decision tree mode
    });

    // Additional state for enhanced features
    const [selectedPoints, setSelectedPoints] = useState(new Set());
    const [highlightConnections, setHighlightConnections] = useState(true);
    const [animationEnabled, setAnimationEnabled] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);

    // Memoized validation and rendering
    const isValidData = useCallback(() => {
        return jsonData &&
            typeof jsonData === "object" &&
            Object.keys(jsonData).length > 0 &&
            labelsData &&
            typeof labelsData === "object";
    }, [jsonData, labelsData]);

    useEffect(() => {
        if (!isValidData()) {
            console.error("Invalid data provided:", { jsonData, labelsData });
            return;
        }

        const cleanup = renderVisualization();
        return cleanup;
    }, [
        jsonData,
        labelsData,
        ringVisibility,
        viewMode,
        showEmptySectors,
        transformStrategy,
        transformOptions,
        selectedPoints,
        highlightConnections,
        animationEnabled
    ]);

    const renderVisualization = () => {
        console.log("=== RENDER VISUALIZATION START ===");
        console.log("Transform Strategy:", transformStrategy);
        console.log("Transform Options:", transformOptions);

        const svg = d3.select(graphRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 800;
        const margin = 20;
        const maxRadius = Math.min(width, height) / 2 - margin;

        const g = svg
            .attr("width", width)
            .attr("height", height)
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        // Create tooltip
        const tooltip = createTooltip();

        // Generate ring structure and colors
        const ringStructure = generateRingStructure(
            jsonData,
            transformStrategy,
            transformOptions,
            labelsData
        );
        console.log("Ring Structure:", ringStructure);

        const { getRingColor, getSectorColor } = generateColorSchemes(ringStructure.length);

        // Create enhanced label color function
        const colorScale = d3.scaleOrdinal(d3.schemeSet3)
            .domain(Object.keys(labelsData.labels || {}));

        const getLabelColor = (pointId) => {
            if (!labelsData || !labelsData.labels) return "#666";
            for (const label of Object.keys(labelsData.labels)) {
                const pointList = labelsData.labels[label];
                if (Array.isArray(pointList) && pointList.includes(Number(pointId))) {
                    return colorScale(label);
                }
            }
            return "#666";
        };

        // Calculate sector counts and angles
        const sectorCounts = calculateSectorPointCounts(
            ringStructure,
            transformStrategy,
            transformOptions,
            labelsData
        );
        console.log("Sector Counts:", sectorCounts);

        const sectorAngles = viewMode === 'proportional' ?
            calculateProportionalSectorAngles(sectorCounts, showEmptySectors) : null;

        // Store point positions for connections
        const pointPositions = {};
        const ringLabels = ringStructure.map((_, i) => String.fromCharCode(65 + i));

        // Enhanced ring rendering with animations
        ringStructure.forEach((ring, index) => {
            if (!ringVisibility[ring.key]) return;

            console.log(`\n--- Processing Ring ${index} (${ring.key}) ---`);

            const innerRadius = (index / ringStructure.length) * maxRadius;
            const outerRadius = ((index + 1) / ringStructure.length) * maxRadius;

            // Render ring sectors with enhanced styling
            renderRingSectors(
                g,
                ring,
                index,
                innerRadius,
                outerRadius,
                getSectorColor,
                sectorCounts[index] || [],
                sectorAngles ? sectorAngles[index] : null,
                animationEnabled
            );

            // Add enhanced ring label
            const ringLabel = g.append("text")
                .attr("x", 0)
                .attr("y", -outerRadius - 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("fill", getRingColor(index))
                .attr("font-weight", "bold")
                .attr("stroke", "white")
                .attr("stroke-width", "0.5")
                .text(`${ringLabels[index]} (${ring.points?.length || 0} points)`);

            if (animationEnabled) {
                ringLabel
                    .style("opacity", 0)
                    .transition()
                    .duration(1000)
                    .delay(index * 200)
                    .style("opacity", 1);
            }

            // Calculate and render points
            const positions = calculatePointPositions(
                ring.points || [],
                index,
                innerRadius,
                outerRadius,
                ring.sectors,
                sectorAngles ? sectorAngles[index] : null,
                viewMode,
                showEmptySectors,
                transformStrategy,
                transformOptions,
                ring
            );

            console.log(`Positions calculated for ring ${index}:`, positions.length);

            positions.forEach(({ point, x, y }, pointIndex) => {
                // Handle both single Point_ID and array Point_ID
                const pointIds = Array.isArray(point.Point_ID) ? point.Point_ID : [point.Point_ID];

                pointIds.forEach((id) => {
                    if (!pointPositions[id]) {
                        pointPositions[id] = [];
                    }
                    pointPositions[id].push({
                        x,
                        y,
                        point,
                        subspaceId: ring.key,
                        ringIndex: index
                    });
                });

                // Draw enhanced point
                drawEnhancedPoint(
                    g,
                    point,
                    x,
                    y,
                    ring,
                    tooltip,
                    labelsData,
                    getLabelColor,
                    pointIndex,
                    animationEnabled
                );
            });
        });

        // Draw enhanced connections
        drawEnhancedConnections(g, pointPositions, getLabelColor, tooltip);

        // Add enhanced zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([0.1, 10])
            .on("zoom", (event) => {
                g.attr("transform", event.transform);
                setZoomLevel(event.transform.k);
            });

        svg.call(zoom);

        // Add zoom controls
        addZoomControls(svg, zoom);

        // Render linear strips
        renderLinearStrips(ringStructure, sectorCounts);

        console.log("=== RENDER VISUALIZATION END ===\n");

        // Cleanup function
        return () => {
            tooltip.remove();
        };
    };

    const createTooltip = () => {
        return d3
            .select("body")
            .append("div")
            .attr("class", "hierarchical-tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(0, 0, 0, 0.85)")
            .style("color", "white")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("font-size", "12px")
            .style("font-family", "monospace")
            .style("z-index", "10000")
            .style("box-shadow", "0 2px 8px rgba(0,0,0,0.3)")
            .style("max-width", "300px")
            .style("line-height", "1.4");
    };

    const renderRingSectors = (
        g,
        ring,
        ringIndex,
        innerRadius,
        outerRadius,
        getSectorColor,
        sectorCounts,
        sectorAngles,
        animated = false
    ) => {
        const rotationOffset = Math.PI / 2;
        const sectorsGroup = g.append("g").attr("class", `ring-${ringIndex}-sectors`);

        if (viewMode === 'normal') {
            const sectorsToRender = showEmptySectors ?
                Array.from({ length: ring.sectors }, (_, i) => i) :
                Array.from({ length: ring.sectors }, (_, i) => i).filter(i => (sectorCounts[i] || 0) > 0);

            const anglePerSector = 2 * Math.PI / (showEmptySectors ? ring.sectors : sectorsToRender.length);

            sectorsToRender.forEach((sectorIndex, displayIndex) => {
                const actualIndex = showEmptySectors ? sectorIndex : displayIndex;
                const startAngle = (anglePerSector * actualIndex) + rotationOffset;
                const endAngle = (anglePerSector * (actualIndex + 1)) + rotationOffset;

                const sector = sectorsGroup.append("path")
                    .attr("d", d3.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius)
                        .startAngle(startAngle)
                        .endAngle(endAngle)
                    )
                    .attr("fill", getSectorColor(ringIndex, sectorIndex))
                    .attr("fill-opacity", 0.3)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 0.5)
                    .style("cursor", "pointer")
                    .on("mouseover", function () {
                        d3.select(this).attr("fill-opacity", 0.6);
                    })
                    .on("mouseout", function () {
                        d3.select(this).attr("fill-opacity", 0.3);
                    });

                if (animated) {
                    sector
                        .style("opacity", 0)
                        .transition()
                        .duration(800)
                        .delay(ringIndex * 100 + actualIndex * 50)
                        .style("opacity", 1);
                }
            });

        } else if (viewMode === 'proportional' && sectorAngles) {
            let currentAngle = rotationOffset;

            sectorAngles.forEach((angle, sectorIndex) => {
                if (!showEmptySectors && angle === 0) return;

                const startAngle = currentAngle;
                const endAngle = currentAngle + angle;

                const sector = sectorsGroup.append("path")
                    .attr("d", d3.arc()
                        .innerRadius(innerRadius)
                        .outerRadius(outerRadius)
                        .startAngle(startAngle)
                        .endAngle(endAngle)
                    )
                    .attr("fill", getSectorColor(ringIndex, sectorIndex))
                    .attr("fill-opacity", 0.3)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 0.3)
                    .style("cursor", "pointer")
                    .on("mouseover", function () {
                        d3.select(this).attr("fill-opacity", 0.6);
                    })
                    .on("mouseout", function () {
                        d3.select(this).attr("fill-opacity", 0.3);
                    });

                if (animated) {
                    sector
                        .style("opacity", 0)
                        .transition()
                        .duration(800)
                        .delay(ringIndex * 100 + sectorIndex * 50)
                        .style("opacity", 1);
                }

                currentAngle = endAngle;
            });
        }
    };

    const drawEnhancedPoint = (g, point, x, y, ring, tooltip, labelsData, getLabelColor, pointIndex, animated) => {
        const pointIds = Array.isArray(point.Point_ID) ? point.Point_ID : [point.Point_ID];
        const isSelected = pointIds.some(id => selectedPoints.has(id));

        const pointElement = g.append("circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", isSelected ? 5 : 3)
            .attr("fill", isSelected ? "#ff4444" : getLabelColor(pointIds[0]) || "#333")
            .attr("stroke", isSelected ? "#fff" : "#fff")
            .attr("stroke-width", isSelected ? 2 : 1)
            .style("pointer-events", "visible")
            .style("cursor", "pointer")
            .on("click", () => {
                const newSelected = new Set(selectedPoints);
                const wasSelected = pointIds.some(id => selectedPoints.has(id));

                if (wasSelected) {
                    pointIds.forEach(id => newSelected.delete(id));
                } else {
                    pointIds.forEach(id => newSelected.add(id));
                }
                setSelectedPoints(newSelected);
            })
            .on("mouseover", (event) => {
                const pointIdsStr = pointIds.join(", ");
                let associatedLabels = [];

                if (labelsData && labelsData.labels) {
                    Object.entries(labelsData.labels).forEach(([label, pointList]) => {
                        if (pointIds.some(id => pointList.includes(Number(id)))) {
                            associatedLabels.push(label);
                        }
                    });
                }

                const labelText = associatedLabels.length > 0 ? associatedLabels.join(", ") : "No Label";
                const transformInfo = getTransformationInfo(point);

                tooltip
                    .style("visibility", "visible")
                    .html(
                        `<strong>Point IDs:</strong> ${pointIdsStr}<br>` +
                        `<strong>Position:</strong> (${x.toFixed(2)}, ${y.toFixed(2)})<br>` +
                        `<strong>Subspace:</strong> ${ring.key}<br>` +
                        `<strong>Labels:</strong> ${labelText}<br>` +
                        `<strong>Transform:</strong> ${transformInfo}<br>` +
                        `<strong>Ring:</strong> ${ring.subspaceId || 'N/A'}`
                    );

                setHoveredCoordinates({ ...point, label: labelText });

                // Highlight effect
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr("r", isSelected ? 7 : 5)
                    .attr("stroke-width", 3);
            })
            .on("mousemove", (event) => {
                tooltip
                    .style("top", (event.pageY + 10) + "px")
                    .style("left", (event.pageX + 10) + "px");
            })
            .on("mouseout", (event) => {
                tooltip.style("visibility", "hidden");
                setHoveredCoordinates(null);

                // Remove highlight effect
                d3.select(event.currentTarget)
                    .transition()
                    .duration(200)
                    .attr("r", isSelected ? 5 : 3)
                    .attr("stroke-width", isSelected ? 2 : 1);
            });

        if (animated) {
            pointElement
                .style("opacity", 0)
                .attr("r", 0)
                .transition()
                .duration(600)
                .delay(pointIndex * 20)
                .style("opacity", 1)
                .attr("r", isSelected ? 5 : 3);
        }
    };

    const drawEnhancedConnections = (g, pointPositions, getLabelColor, tooltip) => {
        if (!highlightConnections) return;

        const connectionsGroup = g.append("g").attr("class", "connections");

        Object.entries(pointPositions).forEach(([pointId, positions]) => {
            if (positions.length > 1) {
                const isHighlighted = selectedPoints.has(Number(pointId));

                for (let i = 0; i < positions.length - 1; i++) {
                    connectionsGroup.append("line")
                        .attr("x1", positions[i].x)
                        .attr("y1", positions[i].y)
                        .attr("x2", positions[i + 1].x)
                        .attr("y2", positions[i + 1].y)
                        .attr("stroke", isHighlighted ? "#ff4444" : getLabelColor(pointId))
                        .attr("stroke-width", isHighlighted ? 2 : 1)
                        .attr("stroke-opacity", isHighlighted ? 0.9 : 0.6)
                        .attr("stroke-dasharray", isHighlighted ? "none" : "2,2")
                        .style("cursor", "pointer")
                        .on("mouseover", (event) => {
                            tooltip
                                .style("visibility", "visible")
                                .html(`<strong>Connection:</strong> Point ID ${pointId}<br>
                                       <strong>Between:</strong> ${positions[i].subspaceId} → ${positions[i + 1].subspaceId}`);

                            d3.select(event.currentTarget)
                                .attr("stroke-width", 3)
                                .attr("stroke-opacity", 1);
                        })
                        .on("mousemove", (event) => {
                            tooltip
                                .style("top", (event.pageY + 10) + "px")
                                .style("left", (event.pageX + 10) + "px");
                        })
                        .on("mouseout", (event) => {
                            tooltip.style("visibility", "hidden");
                            d3.select(event.currentTarget)
                                .attr("stroke-width", isHighlighted ? 2 : 1)
                                .attr("stroke-opacity", isHighlighted ? 0.9 : 0.6);
                        });
                }
            }
        });
    };

    const addZoomControls = (svg, zoom) => {
        const controlsGroup = svg.append("g")
            .attr("class", "zoom-controls")
            .attr("transform", "translate(20, 20)");

        // Zoom in button
        controlsGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("r", 20)
            .attr("fill", "rgba(255,255,255,0.8)")
            .attr("stroke", "#333")
            .style("cursor", "pointer")
            .on("click", () => {
                svg.transition().call(zoom.scaleBy, 1.5);
            });

        controlsGroup.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text("+")
            .style("font-size", "16px")
            .style("pointer-events", "none");

        // Zoom out button
        controlsGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", 50)
            .attr("r", 20)
            .attr("fill", "rgba(255,255,255,0.8)")
            .attr("stroke", "#333")
            .style("cursor", "pointer")
            .on("click", () => {
                svg.transition().call(zoom.scaleBy, 0.67);
            });

        controlsGroup.append("text")
            .attr("x", 0)
            .attr("y", 50)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text("−")
            .style("font-size", "16px")
            .style("pointer-events", "none");

        // Reset zoom button
        controlsGroup.append("circle")
            .attr("cx", 0)
            .attr("cy", 100)
            .attr("r", 20)
            .attr("fill", "rgba(255,255,255,0.8)")
            .attr("stroke", "#333")
            .style("cursor", "pointer")
            .on("click", () => {
                svg.transition().call(zoom.transform, d3.zoomIdentity);
            });

        controlsGroup.append("text")
            .attr("x", 0)
            .attr("y", 100)
            .attr("text-anchor", "middle")
            .attr("dy", "0.35em")
            .text("⌂")
            .style("font-size", "12px")
            .style("pointer-events", "none");
    };

    const renderLinearStrips = (ringStructure, sectorCounts) => {
        const container = d3.select(stripsContainerRef.current);
        container.selectAll("*").remove();

        ringStructure.forEach((ring, ringIndex) => {
            if (!ringVisibility[ring.key]) return;

            const stripDiv = container.append("div")
                .style("margin-bottom", "20px")
                .style("padding", "10px")
                .style("border", "1px solid #ddd")
                .style("border-radius", "4px")
                .style("background-color", "#f9f9f9");

            stripDiv.append("h3")
                .style("margin", "0 0 10px 0")
                .style("font-size", "14px")
                .text(`Ring ${String.fromCharCode(65 + ringIndex)}: ${ring.key} (${ring.points?.length || 0} points)`);

            const stripSvg = stripDiv.append("svg")
                .attr("width", "100%")
                .attr("height", "60px");

            const stripWidth = 700;
            const stripHeight = 40;
            const counts = sectorCounts[ringIndex] || [];
            const maxCount = Math.max(...counts, 1);

            counts.forEach((count, sectorIndex) => {
                const sectorWidth = stripWidth / counts.length;
                const barHeight = (count / maxCount) * stripHeight;

                stripSvg.append("rect")
                    .attr("x", sectorIndex * sectorWidth)
                    .attr("y", stripHeight - barHeight)
                    .attr("width", sectorWidth - 1)
                    .attr("height", barHeight)
                    .attr("fill", count > 0 ? "#4CAF50" : "#ddd")
                    .attr("stroke", "#333")
                    .attr("stroke-width", 0.5);

                stripSvg.append("text")
                    .attr("x", sectorIndex * sectorWidth + sectorWidth / 2)
                    .attr("y", stripHeight + 15)
                    .attr("text-anchor", "middle")
                    .style("font-size", "10px")
                    .text(count);
            });
        });
    };

    const getTransformationInfo = (point) => {
        const coords = Object.entries(point).filter(([key]) => key !== "Point_ID");
        const values = coords.slice(0, 3).map(([_, val]) => val.toFixed(2)).join(", ");
        const strategy = transformStrategy.replace('_', ' ').toLowerCase();
        return `${strategy} (${values}${coords.length > 3 ? '...' : ''})`;
    };

    const handleTransformOptionChange = (key, value) => {
        setTransformOptions(prev => ({
            ...prev,
            [key]: parseFloat(value) || 0
        }));
    };

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Enhanced Control Panel */}
            <div style={{
                marginBottom: "20px",
                padding: "15px",
                backgroundColor: "#f8f9fa",
                borderRadius: "8px",
                border: "1px solid #e9ecef"
            }}>
                {/* View Mode Controls */}
                <div style={{ marginBottom: "15px" }}>
                    <strong>View Mode:</strong>
                    <div style={{ display: "inline-block", marginLeft: "10px" }}>
                        {['normal', 'proportional'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                style={{
                                    marginRight: "5px",
                                    padding: "6px 12px",
                                    backgroundColor: viewMode === mode ? "#007bff" : "#f8f9fa",
                                    color: viewMode === mode ? "white" : "#495057",
                                    border: "1px solid #dee2e6",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px"
                                }}
                            >
                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Feature Toggles */}
                <div style={{ marginBottom: "15px" }}>
                    <strong>Options:</strong>
                    {[
                        { state: showEmptySectors, setter: setShowEmptySectors, label: 'Empty Sectors' },
                        { state: highlightConnections, setter: setHighlightConnections, label: 'Connections' },
                        { state: animationEnabled, setter: setAnimationEnabled, label: 'Animations' }
                    ].map(({ state, setter, label }) => (
                        <button
                            key={label}
                            onClick={() => setter(!state)}
                            style={{
                                marginLeft: "10px",
                                padding: "6px 12px",
                                backgroundColor: state ? "#28a745" : "#6c757d",
                                color: "white",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "12px"
                            }}
                        >
                            {state ? '✓' : '✗'} {label}
                        </button>
                    ))}
                </div>

                {/* Transformation Strategy Controls */}
                <div style={{ marginBottom: "10px" }}>
                    <strong>Coordinate Transform:</strong>
                    <select
                        value={transformStrategy}
                        onChange={(e) => setTransformStrategy(e.target.value)}
                        style={{
                            marginLeft: "10px",
                            padding: "6px",
                            borderRadius: "4px",
                            border: "1px solid #ced4da",
                            fontSize: "12px"
                        }}
                    >
                        <option value={CoordinateTransforms.POSITIVE_NEGATIVE}>Positive/Negative</option>
                        <option value={CoordinateTransforms.Z_SCORE}>Z-Score</option>
                        <option value={CoordinateTransforms.PERCENTILE}>Percentile</option>
                        <option value={CoordinateTransforms.CUSTOM_THRESHOLD}>Custom Threshold</option>
                        <option value={CoordinateTransforms.DECISION_TREE}>Decision Tree</option>
                    </select>

                    {/* Transform-specific options */}
                    {(transformStrategy === CoordinateTransforms.Z_SCORE ||
                        transformStrategy === CoordinateTransforms.CUSTOM_THRESHOLD) && (
                            <label style={{ marginLeft: "15px", fontSize: "12px" }}>
                                Threshold:
                                <input
                                    type="number"
                                    step="0.1"
                                    value={transformOptions.threshold}
                                    onChange={(e) => handleTransformOptionChange('threshold', e.target.value)}
                                    style={{ marginLeft: "5px", width: "60px", padding: "4px", fontSize: "12px" }}
                                />
                            </label>
                        )}

                    {transformStrategy === CoordinateTransforms.PERCENTILE && (
                        <label style={{ marginLeft: "15px", fontSize: "12px" }}>
                            Percentile:
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={transformOptions.percentile}
                                onChange={(e) => handleTransformOptionChange('percentile', e.target.value)}
                                style={{ marginLeft: "5px", width: "60px", padding: "4px", fontSize: "12px" }}
                            />
                        </label>
                    )}

                    {transformStrategy === CoordinateTransforms.DECISION_TREE && (
                        <label style={{ marginLeft: "15px", fontSize: "12px" }}>
                            Max Depth:
                            <input
                                type="number"
                                min="1"
                                max="10"
                                value={transformOptions.maxDepth}
                                onChange={(e) => handleTransformOptionChange('maxDepth', e.target.value)}
                                style={{ marginLeft: "5px", width: "60px", padding: "4px", fontSize: "12px" }}
                            />
                        </label>
                    )}
                </div>

                {/* Status Info */}
                <div style={{ fontSize: "11px", color: "#6c757d", marginTop: "10px" }}>
                    Selected Points: {selectedPoints.size} | Zoom: {(zoomLevel * 100).toFixed(0)}%
                </div>
            </div>

            {/* Main Visualization */}
            <div style={{ position: "relative" }}>
                <svg ref={graphRef} style={{ width: "100%", height: "800px", border: "1px solid #ddd" }}></svg>
            </div>

             <div style={{ marginTop: "20px" }}>
                 <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Linear Strip Visualizations</h2>
                 <div
                     ref={stripsContainerRef}
                     style={{
                         maxHeight: "500px",
                         overflowY: "auto",
                         border: "1px solid #ddd",
                         borderRadius: "4px",
                         padding: "10px"
                     }}
                 ></div>
             </div>
         </div>
     );
 };

 export default HierarchicalGraph;