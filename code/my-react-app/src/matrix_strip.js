
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const MatrixStripVisualization = ({ jsonData, labelsData, ringVisibility }) => {
    const matrixRef = useRef(null);
    const [viewMode, setViewMode] = useState("normal");
    const [hideEmptySectors, setHideEmptySectors] = useState(false);

    useEffect(() => {
        if (!jsonData || typeof jsonData !== "object" || Object.keys(jsonData).length === 0) {
            console.error("Invalid or empty jsonData:", jsonData);
            return;
        }

        if (!labelsData || typeof labelsData !== "object") {
            console.error("Invalid labelsData:", labelsData);
            return;
        }
      
        // Clear previous content
        const matrixContainer = d3.select(matrixRef.current);
        matrixContainer.selectAll("*").remove();

        // Setup tooltip
        const tooltip = d3
            .select("body")
            .append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("visibility", "hidden")
            .style("background-color", "rgba(0, 0, 0, 0.7)")
            .style("color", "white")
            .style("padding", "5px")
            .style("border-radius", "4px")
            .style("font-size", "12px")
            .style("z-index", "1000");

        // Create matrix layout
        createMatrixVisualization();

        function createMatrixVisualization() {
            const subspaces = Object.keys(jsonData);
            subspaces.sort((a, b) => a.length - b.length);
            const ringLabels = subspaces.map((_, i) => String.fromCharCode(65 + i));

            // Process data for all rings
            const pointsData = subspaces.map((key) => ({
                key,
                points: jsonData[key] || [],
                dimensions: key.length,
                subspaceId: key,
            }));

            // Get color helpers
            const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.keys(labelsData.labels || {}));

            const getRingColor = (index) => {
                const totalRings = Object.keys(jsonData).length;
                const colorScaleInd = d3.scaleSequential(d3.interpolatePlasma).domain([totalRings, 0]);
                return d3.color(colorScaleInd(index));
            };

            const getSectorColor = (index, sectorIndex) => {
                const baseColor = d3.hsl(getRingColor(index));
                const isPositive = sectorIndex % 2 === 0;
                return d3.hsl(baseColor.h, baseColor.s, isPositive ? 0.75 : 0.35).toString();
            };

            // Create flexible grid container instead of table
            const flexContainer = matrixContainer
                .append("div")
                .style("display", "flex")
                .style("flex-direction", "column")
                .style("gap", "10px")
                .style("padding", "10px")
                .style("overflow-x", "auto");
            const totalPointsInDataset = subspaces.reduce((total, key) => {
                return total + (jsonData[key] ? jsonData[key].length : 0);
            }, 0);
            // Create rows for each ring
            subspaces.forEach((key, ringIndex) => {
                if (!ringVisibility[key]) return;

                const sectors = 2 ** (ringIndex + 1);
                const pointBySector = groupPointsBySector(pointsData[ringIndex].points, ringIndex);

                // Calculate total points in this ring for proportional view
                const totalPointsInRing = Object.values(pointBySector).reduce(
                    (sum, points) => sum + points.length,
                    0
                );

                // Find the maximum points in any sector for this ring
                const maxPointsInASector = Math.max(
                    1, // Avoid division by zero
                    ...Object.values(pointBySector).map(points => points.length)
                );

                // Create a row container for this ring
                const rowContainer = flexContainer
                    .append("div")
                    .style("display", "flex")
                    .style("align-items", "stretch")
                    .style("margin-bottom", "8px");

                // Add ring label
                rowContainer
                    .append("div")
                    .style("min-width", "80px")
                    .style("padding", "8px")
                    .style("background-color", "#f5f5f5")
                    .style("border", "1px solid #ddd")
                    .style("font-weight", "bold")
                    .style("display", "flex")
                    .style("align-items", "center")
                    .style("justify-content", "center")
                    .text(`Ring ${ringLabels[ringIndex]}`);

                // Create sectors container
                const sectorsContainer = rowContainer
                    .append("div")
                    .style("display", "flex")
                    .style("flex-wrap", "nowrap")
                    .style("gap", "3px");

                // Add cells for each sector in this ring
                for (let sectorIndex = 0; sectorIndex < sectors; sectorIndex++) {
                    const sectorPoints = pointBySector[sectorIndex] || [];

                    // Skip empty sectors if hideEmptySectors is enabled
                    if (hideEmptySectors && sectorPoints.length === 0) {
                        continue;
                    }

                    // Calculate the width based on view mode
                    let cellWidth;
                    if (viewMode === "normal") {
                        cellWidth = "80px"; // Fixed width for normal mode
                    } else {
                        // Proportional mode
                        const pointsCount = sectorPoints.length;
                        if (pointsCount === 0) {
                            cellWidth = "15px"; // Minimal width for empty sectors (0.1 * 80px)
                        } else {
                            // Calculate proportional width based on number of points
                            // Scale by maxPointsInASector to ensure largest sector is 200px
                            // const baseWidth = Math.max(20, (pointsCount/ maxPointsInASector)*100);
                            // cellWidth = `${baseWidth}px`;
                            // Calculate proportional width based on percentage of total dataset
                            // (points in sector / total points) * 100
                            const percentageOfTotal = (pointsCount / totalPointsInDataset) * 250;
                            // Scale factor to make visualization reasonable
                            const scaleFactor = 5;
                            const baseWidth = Math.max(30, percentageOfTotal * scaleFactor);
                            cellWidth = `${baseWidth}px`;
                        }
                    }

                    // Create cell for this sector
                    const cell = sectorsContainer
                        .append("div")
                        .style("width", cellWidth)
                        .style("border", "1px solid #ddd")
                        .style("background-color", d3.color(getSectorColor(ringIndex, sectorIndex)).toString())
                        .style("position", "relative")
                        .style("padding", "2px")
                        .style("min-height", "80px"); // Ensure consistent height

                    // Add sector number label
                    cell.append("div")
                        .style("position", "absolute")
                        .style("top", "2px")
                        .style("left", "2px")
                        .style("background-color", "rgba(255,255,255,0.7)")
                        .style("padding", "1px 3px")
                        .style("font-size", "9px")
                        .style("border-radius", "2px")
                        .text(`S${sectorIndex}`);

                    // If no points in this sector, show empty state
                    if (sectorPoints.length === 0) {
                        cell.append("div")
                            .style("text-align", "center")
                            .style("padding", "30px 0")
                            .style("color", "#666")
                            .style("font-size", "10px")
                            .text("0");
                        continue;
                    }

                    // Create strip visualization - adjust width based on view mode
                    // const stripWidth = viewMode === "normal" ? 80 :
                    //     Math.max(5, (sectorPoints.length / maxPointsInASector) * 100);
                    const stripWidth = viewMode === "normal" ? 80 :
                        Math.max(30, (sectorPoints.length / totalPointsInDataset) * 250 * 5);

                    createStripForCell(cell, ringIndex, sectorIndex, sectorPoints, stripWidth);
                }
            });

            // Helper function to group points by sector
            function groupPointsBySector(points, ringIndex) {
                const sectors = 2 ** (ringIndex + 1);
                const pointsBySector = {};

                points.forEach(point => {
                    const pointData = Object.entries(point).filter(([key]) => key !== "Point_ID");
                    const bitVector = pointData.map(([_, coord]) => (coord >= 0 ? 1 : 0)).join("");
                    const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);

                    if (!pointsBySector[sectorIndex]) {
                        pointsBySector[sectorIndex] = [];
                    }
                    pointsBySector[sectorIndex].push(point);
                });

                return pointsBySector;
            }

            // Create strip visualization for a single cell
            function createStripForCell(cell, ringIndex, sectorIndex, sectorPoints, stripWidth = 80) {
                const stripHeight = 80;

                // Create SVG for this strip
                const strip = cell.append("svg")
                    .attr("width", stripWidth)
                    .attr("height", stripHeight);

                const margin = { top: 15, right: 7, bottom: 0, left: 2 };
                const availableHeight = stripHeight - margin.top - margin.bottom;
                const availableWidth = stripWidth - margin.left - margin.right;

                const stripG = strip
                    .append("g")
                    .attr("transform", `translate(${margin.left}, ${margin.top})`);

                // Calculate min and max values for this sector
                const values = sectorPoints.map(point => {
                    const coords = Object.entries(point).filter(([key]) => key !== "Point_ID");
                    return coords.reduce((sum, [_, coord]) => sum + Math.abs(coord), 0) / coords.length;
                });

                const minValue = Math.min(...values);
                const maxValue = Math.max(...values);
                const valueRange = maxValue - minValue || 1; // Avoid division by zero

                // Draw lines for each point
                const lineSpacing = availableHeight / (sectorPoints.length + 1);

                sectorPoints.forEach((point, i) => {
                    const y = (i + 1) * lineSpacing;

                    // Draw horizontal line
                    stripG.append("line")
                        .attr("x1", 0)
                        .attr("y1", y)
                        .attr("x2", availableWidth)
                        .attr("y2", y)
                        .attr("stroke", "#ddd")
                        .attr("stroke-width", 0.5);

                    // Calculate position based on value
                    const coords = Object.entries(point).filter(([key]) => key !== "Point_ID");
                    const value = coords.reduce((sum, [_, coord]) => sum + Math.abs(coord), 0) / coords.length;
                    const normalizedValue = (value - minValue) / valueRange;
                    const x = normalizedValue * availableWidth;

                    // Draw the point
                    stripG.append("circle")
                        .attr("cx", x)
                        .attr("cy", y)
                        .attr("r", 2.5)
                        .attr("fill", "black")
                        .attr("stroke", "white")
                        .attr("stroke-width", 0.5)
                        .style("cursor", "pointer")
                        .on("mouseover", (event) => {
                            const pointIds = point.Point_ID.join(", ");
                            let associatedLabels = [];

                            if (labelsData && labelsData.labels) {
                                Object.entries(labelsData.labels).forEach(([label, pointList]) => {
                                    if (point.Point_ID.some(id => pointList.includes(Number(id)))) {
                                        associatedLabels.push(label);
                                    }
                                });
                            }

                            const labelText = associatedLabels.length > 0 ? associatedLabels.join(", ") : "No Label";

                            tooltip
                                .style("visibility", "visible")
                                .html(
                                    `Point_IDs: ${pointIds}<br>Value: ${value.toFixed(2)}<br>Ring: ${ringLabels[ringIndex]}, Sector: ${sectorIndex}<br>Label: ${labelText}`
                                );
                        })
                        .on("mousemove", (event) => {
                            tooltip
                                .style("top", event.pageY + 10 + "px")
                                .style("left", event.pageX + 10 + "px");
                        })
                        .on("mouseout", () => {
                            tooltip.style("visibility", "hidden");
                        });
                });

                // Add count indicator
                stripG.append("text")
                    .attr("x", availableWidth - 2)
                    .attr("y", 0)
                    .attr("text-anchor", "end")
                    .attr("font-size", "8px")
                    .attr("fill", "#333")
                    .text(`n=${sectorPoints.length}`);
            }
        }

        return () => {
            tooltip.remove();
        };
    }, [jsonData, labelsData, ringVisibility, viewMode, hideEmptySectors]);

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "15px" }}>
                <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Matrix Strip Visualization</h2>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
                    <button
                        onClick={() => setViewMode("normal")}
                        style={{
                            padding: "5px 10px",
                            backgroundColor: viewMode === "normal" ? "#4CAF50" : "#f0f0f0",
                            color: viewMode === "normal" ? "white" : "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                    >
                        Normal View
                    </button>
                    <button
                        onClick={() => setViewMode("proportional")}
                        style={{
                            padding: "5px 10px",
                            backgroundColor: viewMode === "proportional" ? "#4CAF50" : "#f0f0f0",
                            color: viewMode === "proportional" ? "white" : "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                    >
                        Proportional View
                    </button>
                    <button
                        onClick={() => setHideEmptySectors(!hideEmptySectors)}
                        style={{
                            padding: "5px 10px",
                            backgroundColor: hideEmptySectors ? "#4CAF50" : "#f0f0f0",
                            color: hideEmptySectors ? "white" : "black",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer"
                        }}
                    >
                        {hideEmptySectors ? "Show Empty Sectors" : "Hide Empty Sectors"}
                    </button>
                </div>
                <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
                    {viewMode === "proportional" ?
                        "Proportional View: Sector width represents the number of points. Empty sectors show as minimal width." :
                        "Normal View: All sectors have uniform width."}
                </div>
            </div>

            <div
                ref={matrixRef}
                style={{
                    width: "100%",
                    overflow: "auto",
                    border: "1px solid #ddd",
                    borderRadius: "4px"
                }}
            ></div>

            <div style={{ marginTop: "10px", fontSize: "12px", color: "#666", textAlign: "center" }}>
                ← Scroll horizontally to see all sectors →
            </div>
        </div>
    );
};

export default MatrixStripVisualization;