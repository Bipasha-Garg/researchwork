import React, { useEffect, useRef, useState, useCallback } from "react";
import * as d3 from "d3";
import {
    CoordinateTransforms,
    transformCoordinates,
    calculateSectorPointCounts,
    calculateProportionalSectorAngles,
    generateRingStructure,
    generateColorSchemes,
    calculatePointPositions,
} from "./ModularB";


const HierarchicalGraph = ({
    jsonData,
    labelsData,
    setHoveredCoordinates,
    ringVisibility
}) => {
    const graphRef = useRef(null);
    const stripsContainerRef = useRef(null);
    const [viewMode, setViewMode] = useState("normal");
    const [showEmptySectors, setShowEmptySectors] = useState(true);
    const [transformStrategy, setTransformStrategy] = useState(CoordinateTransforms.POSITIVE_NEGATIVE);
    const [transformOptions, setTransformOptions] = useState({
        threshold: 0,
        percentile: 50,
        maxDepth: 4, // DT
        minSamplesLeaf: 3, // DT
        minSamplesSplit: 5, // DT
    });

    const [selectedPoints, setSelectedPoints] = useState(new Set());
    const [highlightConnections, setHighlightConnections] = useState(true);
    const [animationEnabled, setAnimationEnabled] = useState(false);
    const [zoomLevel, setZoomLevel] = useState(1);
    const [decisionTreeFullData, setDecisionTreeFullData] = useState(null); // DT

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
        console.log("--- Render Visualization --- Strategy:", transformStrategy, "Options:", transformOptions);

        const svg = d3.select(graphRef.current);
        svg.selectAll("*").remove();

        const width = 800;
        const height = 800;
        const margin = 20;
        const maxRadius = Math.min(width, height) / 2 - margin;

        svg
            .attr("width", width)
            .attr("height", height)
            .attr("viewBox", `0 0 ${width} ${height}`)
            .style("background", "#f0f0f0")
            .style("border", "1px solid #000");

        const g = svg
            .append("g")
            .attr("transform", `translate(${width / 2}, ${height / 2})`);

        const tooltip = createTooltip();

        let ringStructure;
        let sectorCounts;

        ringStructure = generateRingStructure(
            jsonData,
            transformStrategy,
            transformOptions,
            labelsData
        );
        sectorCounts = calculateSectorPointCounts(
            ringStructure,
            transformStrategy,
            transformOptions,
            labelsData
        );

        console.log("Ring Structure:", ringStructure);
        console.log("Sector Counts:", sectorCounts);

        const { getRingColor, getSectorColor } = generateColorSchemes(ringStructure.length);

        // Create enhanced label color function
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
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

        const sectorAngles = viewMode === 'proportional' ?
            calculateProportionalSectorAngles(sectorCounts, showEmptySectors) : null;

        // Store point positions for connections
        const pointPositions = {};
        const ringLabels = ringStructure.map((_, i) => String.fromCharCode(65 + i));

        //// Inside renderVisualization, replace the ringStructure.forEach loop with:
        ringStructure.forEach((ring, index) => {
            if (!ringVisibility[ring.key]) return;

            console.log(`\n--- Processing Ring ${index} (${ring.key}) ---`);

            const innerRadius = (index / ringStructure.length) * maxRadius;
            const outerRadius = ((index + 1) / ringStructure.length) * maxRadius;

            // Render ring sectors
            renderRingSectors(
                g,
                ring,
                index,
                innerRadius,
                outerRadius,
                getSectorColor,
                sectorCounts[index] || [],
                sectorAngles ? sectorAngles[index] : null,
                animationEnabled,
            );

            // Add ring label
            let ringLabelText = `${ringLabels[index]} (${ring.points?.length || 0} points)`;

            const ringLabel = g.append("text")
                .attr("x", 0)
                .attr("y", -outerRadius - 10)
                .attr("text-anchor", "middle")
                .attr("font-size", "14px")
                .attr("fill", getRingColor(index))
                .attr("font-weight", "bold")
                .attr("stroke", "white")
                .attr("stroke-width", "0.5")
                .text(ringLabelText);

            if (animationEnabled) {
                ringLabel
                    .style("opacity", 0)
                    .transition()
                    .duration(1000)
                    .delay(index * 200)
                    .style("opacity", 1);
            }

            // Calculate and render points
            let positions;

            positions = calculatePointPositions(
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

            console.log(`Positions calculated for ring ${index}: ${positions.length}`);

            positions.forEach(({ point, x, y, sectorIndex }, pointIndex) => {
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
                        ringIndex: index,
                        sectorIndex,
                    });
                    console.log(`Stored position for Point_ID ${id} at ring ${index}: x=${x.toFixed(2)}, y=${y.toFixed(2)}`);
                });

                // Draw point
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
                    animationEnabled,
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
        animated = false,
    ) => {
        const rotationOffset = Math.PI / 2; // 0° at 3 o'clock
        const sectorsGroup = g.append("g").attr("class", `ring-${ringIndex}-sectors`);

        if (transformStrategy === CoordinateTransforms.RADIAL) {
            console.log(`Rendering ring ${ringIndex} outline for RADIAL mode`);
            // Draw a single ring outline, 359° anticlockwise
            const ringPath = sectorsGroup.append("path")
                .attr("d", d3.arc()
                    .innerRadius(innerRadius)
                    .outerRadius(outerRadius)
                    .startAngle(rotationOffset)
                    .endAngle(rotationOffset + (359 * Math.PI / 180))
                )
                .attr("fill", "none")
                .attr("stroke", getSectorColor(ringIndex, 0))
                .attr("stroke-width", 2)
                .attr("stroke-opacity", 0.5);

            if (animated) {
                ringPath
                    .style("opacity", 0)
                    .transition()
                    .duration(800)
                    .delay(ringIndex * 100)
                    .style("opacity", 1);
            }
            return;
        }

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
            .attr("stroke-width", isSelected ? 2 : 0.25)
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
                    .attr("r", isSelected ? 8 : 6)
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
                    .attr("stroke-width", isSelected ? 2 : 0.25);
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
        console.log('Drawing connections, pointPositions:', Object.keys(pointPositions).length, 'points');

        Object.entries(pointPositions).forEach(([pointId, positions]) => {
            if (positions.length > 1) {
                const isHighlighted = selectedPoints.has(Number(pointId));
                console.log(`Connecting point ID ${pointId}, positions: ${positions.length}`);

                // Sort positions by ringIndex to ensure sequential connections
                const sortedPositions = positions.sort((a, b) => a.ringIndex - b.ringIndex);

                for (let i = 0; i < sortedPositions.length - 1; i++) {
                    const startPos = sortedPositions[i];
                    const endPos = sortedPositions[i + 1];

                    connectionsGroup.append("line")
                        .attr("x1", startPos.x)
                        .attr("y1", startPos.y)
                        .attr("x2", endPos.x)
                        .attr("y2", endPos.y)
                        .attr("stroke", isHighlighted ? "#ff4444" : getLabelColor(pointId))
                        .attr("stroke-width", isHighlighted ? 2 : 1)
                        .attr("stroke-opacity", isHighlighted ? 0.9 : 0.6)
                        .attr("stroke-dasharray", isHighlighted ? "none" : "2,2")
                        .style("cursor", "pointer")
                        .on("mouseover", (event) => {
                            tooltip
                                .style("visibility", "visible")
                                .html(`<strong>Connection:</strong> Point ID ${pointId}<br>
                                   <strong>Between:</strong> ${startPos.subspaceId} → ${endPos.subspaceId}<br>
                                   <strong>From:</strong> (${startPos.x.toFixed(2)}, ${startPos.y.toFixed(2)})<br>
                                   <strong>To:</strong> (${endPos.x.toFixed(2)}, ${endPos.y.toFixed(2)})`);

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
        if (transformStrategy === CoordinateTransforms.RADIAL) {
            const feature = Object.keys(point).find(key => key !== 'Point_ID' && typeof point[key] === 'number');
            const angle = point.angle !== undefined ? (point.angle * 180 / Math.PI).toFixed(2) : 'N/A';
            return `radial (Feature: ${feature}, Angle: ${angle}°)`;
        }
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
                        <option value={CoordinateTransforms.RADIAL}>Radial</option>
                        <option value={CoordinateTransforms.DECISION_TREE}>DECISION TREE</option>
                    </select>


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
                            Percentile:
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={transformOptions.percentile}
                                onChange={(e) => handleTransformOptionChange('Decision', e.target.value)}
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


            {/* Linear Strip Visualizations */}
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

