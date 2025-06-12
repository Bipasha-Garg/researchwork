
import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

const HierarchicalGraph = ({ jsonData, labelsData, setHoveredCoordinates, ringVisibility }) => {
    const graphRef = useRef(null);
    const stripsContainerRef = useRef(null);
    const [viewMode, setViewMode] = useState("normal");
    const [showEmptySectors, setShowEmptySectors] = useState(true);
    const [classificationMethod, setClassificationMethod] = useState("positive-negative"); // "positive-negative", "z-score", "hybrid"
    const [dimensionStats, setDimensionStats] = useState({});

    useEffect(() => {
        if (!jsonData || typeof jsonData !== "object" || Object.keys(jsonData).length === 0) {
            console.error("Invalid or empty jsonData:", jsonData);
            return;
        }

        if (!labelsData || typeof labelsData !== "object") {
            console.error("Invalid labelsData:", labelsData);
            return;
        }

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

        // Calculate statistics for each dimension across all points in each subspace
        const calculateDimensionStats = () => {
            const stats = {};

            Object.entries(jsonData).forEach(([subspaceKey, points]) => {
                stats[subspaceKey] = {};

                if (points && points.length > 0) {
                    // Get all dimension names (excluding Point_ID)
                    const dimensions = Object.keys(points[0]).filter(key => key !== "Point_ID");

                    dimensions.forEach(dim => {
                        const values = points.map(point => point[dim]).filter(val => val !== undefined && val !== null);

                        if (values.length > 0) {
                            const mean = d3.mean(values);
                            const stddev = d3.deviation(values) || 1; // Avoid division by zero

                            stats[subspaceKey][dim] = { mean, stddev };
                        }
                    });
                }
            });

            return stats;
        };

        const calculatedStats = calculateDimensionStats();
        setDimensionStats(calculatedStats);

        // Function to standardize a coordinate value
        const standardizeCoordinate = (value, subspaceKey, dimension) => {
            const stats = calculatedStats[subspaceKey]?.[dimension];
            if (!stats) return 0;
            return (value - stats.mean) / stats.stddev;
        };

        // Function to determine sector based on classification method
        const getSectorIndex = (point, subspaceKey) => {
            const pointData = Object.entries(point).filter(([key]) => key !== "Point_ID");

            let bitVector;

            if (classificationMethod === "positive-negative") {
                // Original method: positive = 1, negative = 0
                bitVector = pointData.map(([_, coord]) => (coord >= 0 ? 1 : 0)).join("");
            } else if (classificationMethod === "z-score") {
                // Z-score method: above mean = 1, below mean = 0
                bitVector = pointData.map(([dim, coord]) => {
                    const standardized = standardizeCoordinate(coord, subspaceKey, dim);
                    return standardized >= 0 ? 1 : 0;
                }).join("");
            } else if (classificationMethod === "hybrid") {
                // Hybrid method: combine both approaches
                bitVector = pointData.map(([dim, coord]) => {
                    const standardized = standardizeCoordinate(coord, subspaceKey, dim);
                    const positiveNegative = coord >= 0 ? 1 : 0;
                    const zScore = standardized >= 0 ? 1 : 0;
                    // Use z-score if standardized value is significantly different from 0
                    return Math.abs(standardized) > 0.5 ? zScore : positiveNegative;
                }).join("");
            }

            const dimensions = pointData.length;
            const maxSectors = 2 ** dimensions;
            return Math.min(parseInt(bitVector, 2), maxSectors - 1);
        };

        const getLabelColor = (pointId) => {
            if (!labelsData || !labelsData.labels) return "gray";
            for (const label of Object.keys(labelsData.labels)) {
                const pointList = labelsData.labels[label];
                if (Array.isArray(pointList) && pointList.includes(Number(pointId))) {
                    return colorScale(label);
                }
            }
            return "gray";
        };

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

        const subspaces = Object.keys(jsonData);
        subspaces.sort((a, b) => a.length - b.length);
        const pointsData = subspaces.map((key) => ({
            key,
            points: jsonData[key] || [],
            dimensions: key.length,
            subspaceId: key,
        }));
        const ringLabels = subspaces.map((_, i) => String.fromCharCode(65 + i));
        const pointPositions = {};

        const calculateSectorPointCounts = () => {
            const sectorCounts = subspaces.map((key, index) => {
                const sectors = 2 ** (index + 1);
                return Array(sectors).fill(0);
            });

            subspaces.forEach((key, index) => {
                const points = pointsData[index].points;
                const sectors = 2 ** (index + 1);

                points.forEach(point => {
                    const sectorIndex = getSectorIndex(point, key);
                    if (sectorIndex < sectors) {
                        sectorCounts[index][sectorIndex]++;
                    }
                });
            });

            return sectorCounts;
        };

        const calculateRecursiveSectorAngles = () => {
            const sectorCounts = calculateSectorPointCounts();
            const sectorAngles = [];
            const rotationOffset = Math.PI / 2;
            const lastRingIndex = subspaces.length - 1;

            for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
                const sectors = 2 ** (ringIndex + 1);
                const totalPoints = pointsData[ringIndex].points.length || 1;
                const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

                if (ringIndex === lastRingIndex) {
                    const emptySectors = sectorCounts[ringIndex].filter(count => count === 0).length;
                    const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

                    const angles = sectorCounts[ringIndex].map(count => {
                        return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
                    });

                    sectorAngles[ringIndex] = angles;
                }
                else {
                    const outerAngles = sectorAngles[ringIndex + 1];
                    const innerSectors = 2 ** (ringIndex + 1);
                    const outerSectors = 2 ** (ringIndex + 2);
                    const ratio = outerSectors / innerSectors;

                    const angles = [];
                    for (let i = 0; i < innerSectors; i++) {
                        let sumAngle = 0;
                        for (let j = 0; j < ratio; j++) {
                            const outerIdx = i * ratio + j;
                            sumAngle += outerAngles[outerIdx];
                        }
                        angles.push(sumAngle);
                    }

                    sectorAngles[ringIndex] = angles;
                }
            }

            return sectorAngles;
        };

        const renderNormalView = () => {
            subspaces.forEach((key, index) => {
                if (!ringVisibility[key]) return;
                const innerRadius = (index / subspaces.length) * maxRadius;
                const outerRadius = ((index + 1) / subspaces.length) * maxRadius;
                const sectors = 2 ** (index + 1);
                const rotationOffset = Math.PI / 2;

                const sectorCounts = calculateSectorPointCounts();
                const sectorsToRender = showEmptySectors ?
                    Array.from({ length: sectors }, (_, i) => i) :
                    Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[index][i] > 0);

                if (showEmptySectors) {
                    for (let i = 0; i < sectors; i++) {
                        const startAngle = (2 * Math.PI * i) / sectors + rotationOffset;
                        const endAngle = (2 * Math.PI * (i + 1)) / sectors + rotationOffset;

                        g.append("path")
                            .attr("d", d3.arc()
                                .innerRadius(innerRadius)
                                .outerRadius(outerRadius)
                                .startAngle(startAngle)
                                .endAngle(endAngle)
                            )
                            .attr("fill", getSectorColor(index, i))
                            .attr("fill-opacity", 0.3)
                            .attr("stroke", "black")
                            .attr("stroke-width", 0.5)
                            .style("cursor", "pointer");
                    }
                } else {
                    const nonEmptySectors = sectorsToRender.length;
                    sectorsToRender.forEach((sectorIndex, displayIndex) => {
                        const startAngle = (2 * Math.PI * displayIndex) / nonEmptySectors + rotationOffset;
                        const endAngle = (2 * Math.PI * (displayIndex + 1)) / nonEmptySectors + rotationOffset;

                        g.append("path")
                            .attr("d", d3.arc()
                                .innerRadius(innerRadius)
                                .outerRadius(outerRadius)
                                .startAngle(startAngle)
                                .endAngle(endAngle)
                            )
                            .attr("fill", getSectorColor(index, sectorIndex))
                            .attr("fill-opacity", 0.3)
                            .attr("stroke", "black")
                            .attr("stroke-width", 0.5)
                            .style("cursor", "pointer");
                    });
                }

                g.append("text")
                    .attr("x", 0)
                    .attr("y", -outerRadius - 5)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "16px")
                    .attr("fill", "red")
                    .attr("font-weight", "bold")
                    .text(ringLabels[index]);

                renderPointsNormal(index, innerRadius, outerRadius, sectors, key);
            });
        };

        const renderProportionalView = () => {
            const sectorAngles = calculateRecursiveSectorAngles();
            const rotationOffset = Math.PI / 2;

            subspaces.forEach((key, index) => {
                if (!ringVisibility[key]) return;
                const innerRadius = (index / subspaces.length) * maxRadius;
                const outerRadius = ((index + 1) / subspaces.length) * maxRadius;

                let currentAngle = rotationOffset;
                sectorAngles[index].forEach((angle, i) => {
                    if (!showEmptySectors && angle === 0) {
                        return;
                    }

                    const startAngle = currentAngle;
                    const endAngle = currentAngle + angle;

                    g.append("path")
                        .attr("d", d3.arc()
                            .innerRadius(innerRadius)
                            .outerRadius(outerRadius)
                            .startAngle(startAngle)
                            .endAngle(endAngle)
                        )
                        .attr("fill", getSectorColor(index, i))
                        .attr("fill-opacity", 0.3)
                        .attr("stroke", "black")
                        .attr("stroke-width", 0.3)
                        .style("cursor", "pointer");

                    currentAngle = endAngle;
                });

                g.append("text")
                    .attr("x", 0)
                    .attr("y", -outerRadius - 5)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "16px")
                    .attr("fill", "red")
                    .attr("font-weight", "bold")
                    .text(ringLabels[index]);

                renderPointsProportional(index, innerRadius, outerRadius, sectorAngles[index], key);
            });
        };

        const renderPointsNormal = (index, innerRadius, outerRadius, sectors, subspaceKey) => {
            const rotationOffset = 0;
            const sectorCounts = calculateSectorPointCounts();

            if (showEmptySectors) {
                const anglePerSector = 2 * Math.PI / sectors;
                pointsData[index].points.forEach((point, i) => {
                    const sectorIndex = getSectorIndex(point, subspaceKey);

                    const startAngle = (anglePerSector * sectorIndex) + rotationOffset;
                    const centerAngle = startAngle + (anglePerSector / 2);

                    const totalPoints = pointsData[index].points.length;
                    const clusterFactor = 0.9;
                    const overlapRadius =
                        innerRadius +
                        (clusterFactor * (outerRadius - innerRadius) * (i % totalPoints)) /
                        totalPoints;
                    const x = overlapRadius * Math.cos(centerAngle);
                    const y = overlapRadius * Math.sin(centerAngle);

                    storePointPosition(point, x, y, index);
                    drawPoint(point, x, y, index, subspaceKey);
                });
            } else {
                const sectorsWithPoints = Array.from({ length: sectors }, (_, i) => i)
                    .filter(i => sectorCounts[index][i] > 0);
                const nonEmptySectors = sectorsWithPoints.length;

                if (nonEmptySectors > 0) {
                    const anglePerSector = 2 * Math.PI / nonEmptySectors;

                    pointsData[index].points.forEach((point, i) => {
                        const sectorIndex = getSectorIndex(point, subspaceKey);
                        const displayIndex = sectorsWithPoints.indexOf(sectorIndex);
                        if (displayIndex === -1) return;

                        const startAngle = (anglePerSector * displayIndex) + rotationOffset;
                        const centerAngle = startAngle + (anglePerSector / 2);

                        const totalPoints = pointsData[index].points.length;
                        const clusterFactor = 0.9;
                        const overlapRadius =
                            innerRadius +
                            (clusterFactor * (outerRadius - innerRadius) * (i % totalPoints)) /
                            totalPoints;
                        const x = overlapRadius * Math.cos(centerAngle);
                        const y = overlapRadius * Math.sin(centerAngle);

                        storePointPosition(point, x, y, index);
                        drawPoint(point, x, y, index, subspaceKey);
                    });
                }
            }
        };

        const renderPointsProportional = (index, innerRadius, outerRadius, sectorAngles, subspaceKey) => {
            const rotationOffset = 0;
            const pointsBySector = {};

            pointsData[index].points.forEach(point => {
                const sectorIndex = getSectorIndex(point, subspaceKey);
                if (!pointsBySector[sectorIndex]) {
                    pointsBySector[sectorIndex] = [];
                }
                pointsBySector[sectorIndex].push(point);
            });

            let currentAngle = rotationOffset;
            const startAngles = sectorAngles.map((angle, i) => {
                const startAngle = currentAngle;
                currentAngle += angle;
                return startAngle;
            });

            Object.entries(pointsBySector).forEach(([sectorIndex, points]) => {
                const sectorIdx = parseInt(sectorIndex);
                const sectorAngle = sectorAngles[sectorIdx];

                if (!showEmptySectors && sectorAngle === 0) {
                    return;
                }

                const startAngle = startAngles[sectorIdx];
                const centerAngle = startAngle + (sectorAngle / 2);

                points.forEach((point, i) => {
                    const totalPointsInSector = points.length;
                    const clusterFactor = 0.9;
                    const overlapRadius =
                        innerRadius +
                        (clusterFactor * (outerRadius - innerRadius) * (i % Math.max(1, totalPointsInSector))) /
                        Math.max(1, totalPointsInSector);

                    const x = overlapRadius * Math.cos(centerAngle);
                    const y = overlapRadius * Math.sin(centerAngle);

                    storePointPosition(point, x, y, index);
                    drawPoint(point, x, y, index, subspaceKey);
                });
            });
        };

        const storePointPosition = (point, x, y, index) => {
            point.Point_ID.forEach((id) => {
                if (!pointPositions[id]) {
                    pointPositions[id] = [];
                }
                pointPositions[id].push({ x, y, point, subspaceId: pointsData[index].key });
            });
        };

        const drawPoint = (point, x, y, index, subspaceKey) => {
            g.append("circle")
                .attr("cx", x)
                .attr("cy", y)
                .attr("r", 3)
                .attr("fill", "black")
                .attr("stroke", "white")
                .attr("stroke-width", 0.5)
                .style("pointer-events", "visible")
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

                    // Get coordinates for display based on classification method
                    const pointData = Object.entries(point).filter(([key]) => key !== "Point_ID");
                    let coordsDisplay = "";

                    if (classificationMethod === "positive-negative") {
                        coordsDisplay = pointData.map(([dim, coord]) =>
                            `${dim}: ${coord.toFixed(2)}`
                        ).join("<br>");
                    } else if (classificationMethod === "z-score") {
                        coordsDisplay = pointData.map(([dim, coord]) => {
                            const zScore = standardizeCoordinate(coord, subspaceKey, dim);
                            return `${dim}: ${coord.toFixed(2)} (z=${zScore.toFixed(2)})`;
                        }).join("<br>");
                    } else if (classificationMethod === "hybrid") {
                        coordsDisplay = pointData.map(([dim, coord]) => {
                            const zScore = standardizeCoordinate(coord, subspaceKey, dim);
                            return `${dim}: ${coord.toFixed(2)} (z=${zScore.toFixed(2)})`;
                        }).join("<br>");
                    }

                    tooltip
                        .style("visibility", "visible")
                        .html(
                            `Point_IDs: ${pointIds}<br>Coordinates:<br>${coordsDisplay}<br>Position: (${x.toFixed(2)}, ${y.toFixed(2)})<br>Subspace: ${pointsData[index].key}<br>Label: ${labelText}<br>Method: ${classificationMethod}`
                        );
                    setHoveredCoordinates({ ...point, label: labelText });
                })
                .on("mousemove", (event) => {
                    tooltip
                        .style("top", event.pageY + 10 + "px")
                        .style("left", event.pageX + 10 + "px");
                })
                .on("mouseout", () => {
                    tooltip.style("visibility", "hidden");
                    setHoveredCoordinates(null);
                });
        };

        if (viewMode === "normal") {
            renderNormalView();
        } else if (viewMode === "proportional") {
            renderProportionalView();
        }

        Object.entries(pointPositions).forEach(([pointId, positions]) => {
            if (positions.length > 1) {
                for (let i = 0; i < positions.length - 1; i++) {
                    const line = g.append("line")
                        .attr("x1", positions[i].x)
                        .attr("y1", positions[i].y)
                        .attr("x2", positions[i + 1].x)
                        .attr("y2", positions[i + 1].y)
                        .attr("stroke", getLabelColor(pointId))
                        .attr("stroke-width", 0.7)
                        .attr("stroke-opacity", 0.9)
                        .style("cursor", "pointer")
                        .on("mouseover", (event) => {
                            tooltip
                                .style("visibility", "visible")
                                .html(`Connection: Point_ID ${pointId}`);
                        })
                        .on("mousemove", (event) => {
                            tooltip
                                .style("top", event.pageY + 10 + "px")
                                .style("left", event.pageX + 10 + "px");
                        })
                        .on("mouseout", () => {
                            tooltip.style("visibility", "hidden");
                        });
                }
            }
        });

        const zoom = d3.zoom().on("zoom", (event) => {
            g.attr("transform", event.transform);
        });
        svg.call(zoom);

        return () => {
            tooltip.remove();
        };
    }, [jsonData, labelsData, ringVisibility, setHoveredCoordinates, viewMode, showEmptySectors, classificationMethod]);

    const getClassificationDescription = () => {
        switch (classificationMethod) {
            case "positive-negative":
                return "Points are classified into sectors based on whether each coordinate is positive (≥0) or negative (<0).";
            case "z-score":
                return "Points are classified into sectors based on whether each dimension is above (≥0) or below (<0) the mean after standardization using z-scores: (value - mean) / standard deviation.";
            case "hybrid":
                return "Points are classified using a hybrid approach: z-score method for dimensions with significant deviation (|z| > 0.5), otherwise positive/negative method.";
            default:
                return "";
        }
    };

    const renderStatsDisplay = () => {
        if (classificationMethod !== "z-score" && classificationMethod !== "hybrid") {
            return null;
        }

        return (
            <div style={{
                marginBottom: "10px",
                padding: "15px",
                backgroundColor: "#e8f5e8",
                borderRadius: "8px",
                border: "2px solid #4CAF50"
            }}>
                <h3 style={{ fontSize: "16px", marginBottom: "15px", color: "#2E7D32" }}>
                    📊 Dimension Statistics (Subspace-wise)
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "15px" }}>
                    {Object.entries(dimensionStats).map(([subspaceKey, stats]) => (
                        <div key={subspaceKey} style={{
                            backgroundColor: "white",
                            padding: "12px",
                            borderRadius: "6px",
                            border: "1px solid #C5E1A5"
                        }}>
                            <h4 style={{ fontSize: "14px", marginBottom: "8px", color: "#1B5E20", fontWeight: "bold" }}>
                                Subspace: {subspaceKey}
                            </h4>
                            <div style={{ fontSize: "12px" }}>
                                {Object.entries(stats).map(([dimension, { mean, stddev }]) => (
                                    <div key={dimension} style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        marginBottom: "4px",
                                        padding: "2px 0"
                                    }}>
                                        <span style={{ fontWeight: "500" }}>{dimension}:</span>
                                        <span style={{ fontFamily: "monospace" }}>
                                            μ={mean.toFixed(3)}, σ={stddev.toFixed(3)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "10px" }}>
                <button
                    onClick={() => setViewMode("normal")}
                    style={{
                        marginRight: "10px",
                        padding: "5px 10px",
                        backgroundColor: viewMode === "normal" ? "#4CAF50" : "#f0f0f0",
                        color: viewMode === "normal" ? "white" : "black",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Normal View
                </button>
                <button
                    onClick={() => setViewMode("proportional")}
                    style={{
                        marginRight: "10px",
                        padding: "5px 10px",
                        backgroundColor: viewMode === "proportional" ? "#4CAF50" : "#f0f0f0",
                        color: viewMode === "proportional" ? "white" : "black",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Proportional View
                </button>
                <button
                    onClick={() => setShowEmptySectors(!showEmptySectors)}
                    style={{
                        padding: "5px 10px",
                        backgroundColor: showEmptySectors ? "#2196F3" : "#ff9800",
                        color: "white",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    {showEmptySectors ? "Hide Empty Sectors" : "Show Empty Sectors"}
                </button>
            </div>

            <div style={{ marginBottom: "10px" }}>
                <button
                    onClick={() => setClassificationMethod("positive-negative")}
                    style={{
                        marginRight: "10px",
                        padding: "5px 10px",
                        backgroundColor: classificationMethod === "positive-negative" ? "#9C27B0" : "#f0f0f0",
                        color: classificationMethod === "positive-negative" ? "white" : "black",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Positive/Negative
                </button>
                <button
                    onClick={() => setClassificationMethod("z-score")}
                    style={{
                        marginRight: "10px",
                        padding: "5px 10px",
                        backgroundColor: classificationMethod === "z-score" ? "#9C27B0" : "#f0f0f0",
                        color: classificationMethod === "z-score" ? "white" : "black",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Z-Score
                </button>
                <button
                    onClick={() => setClassificationMethod("hybrid")}
                    style={{
                        padding: "5px 10px",
                        backgroundColor: classificationMethod === "hybrid" ? "#9C27B0" : "#f0f0f0",
                        color: classificationMethod === "hybrid" ? "white" : "black",
                        border: "1px solid #ccc",
                        borderRadius: "4px",
                        cursor: "pointer"
                    }}
                >
                    Hybrid
                </button>
            </div>

            {renderStatsDisplay()}

            <div style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
                <strong>Classification Method ({classificationMethod}):</strong> {getClassificationDescription()}
            </div>

            <svg ref={graphRef} style={{ width: "100%", height: "800px" }}></svg>

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




// import React, { useEffect, useRef, useState } from "react";
// import * as d3 from "d3";

// const HierarchicalGraph = ({ jsonData, labelsData, setHoveredCoordinates, ringVisibility }) => {
//     const graphRef = useRef(null);
//     const stripsContainerRef = useRef(null);
//     const [viewMode, setViewMode] = useState("normal");
//     const [showEmptySectors, setShowEmptySectors] = useState(true);

//     useEffect(() => {
//         if (!jsonData || typeof jsonData !== "object" || Object.keys(jsonData).length === 0) {
//             console.error("Invalid or empty jsonData:", jsonData);
//             return;
//         }

//         if (!labelsData || typeof labelsData !== "object") {
//             console.error("Invalid labelsData:", labelsData);
//             return;
//         }

//         const svg = d3.select(graphRef.current);
//         svg.selectAll("*").remove();

//         const width = 800;
//         const height = 800;
//         const margin = 20;
//         const maxRadius = Math.min(width, height) / 2 - margin;

//         const g = svg
//             .attr("width", width)
//             .attr("height", height)
//             .append("g")
//             .attr("transform", `translate(${width / 2}, ${height / 2})`);

//         const tooltip = d3
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

//         // Calculate statistics for each dimension across all points in each subspace
//         const calculateDimensionStats = () => {
//             const stats = {};

//             Object.entries(jsonData).forEach(([subspaceKey, points]) => {
//                 stats[subspaceKey] = {};

//                 if (points && points.length > 0) {
//                     // Get all dimension names (excluding Point_ID)
//                     const dimensions = Object.keys(points[0]).filter(key => key !== "Point_ID");

//                     dimensions.forEach(dim => {
//                         const values = points.map(point => point[dim]).filter(val => val !== undefined && val !== null);

//                         if (values.length > 0) {
//                             const mean = d3.mean(values);
//                             const stddev = d3.deviation(values) || 1; // Avoid division by zero

//                             stats[subspaceKey][dim] = { mean, stddev };
//                         }
//                     });
//                 }
//             });

//             return stats;
//         };

//         const dimensionStats = calculateDimensionStats();

//         // Function to standardize a coordinate value
//         const standardizeCoordinate = (value, subspaceKey, dimension) => {
//             const stats = dimensionStats[subspaceKey]?.[dimension];
//             if (!stats) return 0;
//             return (value - stats.mean) / stats.stddev;
//         };

//         // Function to determine sector based on standardized coordinates
//         const getSectorIndex = (point, subspaceKey) => {
//             const pointData = Object.entries(point).filter(([key]) => key !== "Point_ID");
//             const bitVector = pointData.map(([dim, coord]) => {
//                 const standardized = standardizeCoordinate(coord, subspaceKey, dim);
//                 return standardized >= 0 ? 1 : 0; // Above mean = 1, below mean = 0
//             }).join("");

//             const dimensions = pointData.length;
//             const maxSectors = 2 ** dimensions;
//             return Math.min(parseInt(bitVector, 2), maxSectors - 1);
//         };

//         const getLabelColor = (pointId) => {
//             if (!labelsData || !labelsData.labels) return "gray";
//             for (const label of Object.keys(labelsData.labels)) {
//                 const pointList = labelsData.labels[label];
//                 if (Array.isArray(pointList) && pointList.includes(Number(pointId))) {
//                     return colorScale(label);
//                 }
//             }
//             return "gray";
//         };

//         const colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(Object.keys(labelsData.labels || {}));
//         const getRingColor = (index) => {
//             const totalRings = Object.keys(jsonData).length;
//             const colorScaleInd = d3.scaleSequential(d3.interpolatePlasma).domain([totalRings, 0]);
//             return d3.color(colorScaleInd(index));
//         };
//         const getSectorColor = (index, sectorIndex) => {
//             const baseColor = d3.hsl(getRingColor(index));
//             const isPositive = sectorIndex % 2 === 0;
//             return d3.hsl(baseColor.h, baseColor.s, isPositive ? 0.75 : 0.35).toString();
//         };

//         const subspaces = Object.keys(jsonData);
//         subspaces.sort((a, b) => a.length - b.length);
//         const pointsData = subspaces.map((key) => ({
//             key,
//             points: jsonData[key] || [],
//             dimensions: key.length,
//             subspaceId: key,
//         }));
//         const ringLabels = subspaces.map((_, i) => String.fromCharCode(65 + i));
//         const pointPositions = {};

//         const calculateSectorPointCounts = () => {
//             const sectorCounts = subspaces.map((key, index) => {
//                 const sectors = 2 ** (index + 1);
//                 return Array(sectors).fill(0);
//             });

//             subspaces.forEach((key, index) => {
//                 const points = pointsData[index].points;
//                 const sectors = 2 ** (index + 1);

//                 points.forEach(point => {
//                     const sectorIndex = getSectorIndex(point, key);
//                     if (sectorIndex < sectors) {
//                         sectorCounts[index][sectorIndex]++;
//                     }
//                 });
//             });

//             return sectorCounts;
//         };

//         const calculateRecursiveSectorAngles = () => {
//             const sectorCounts = calculateSectorPointCounts();
//             const sectorAngles = [];
//             const rotationOffset = Math.PI / 2;
//             const lastRingIndex = subspaces.length - 1;

//             for (let ringIndex = lastRingIndex; ringIndex >= 0; ringIndex--) {
//                 const sectors = 2 ** (ringIndex + 1);
//                 const totalPoints = pointsData[ringIndex].points.length || 1;
//                 const minAngle = showEmptySectors ? 0.05 * (Math.PI * 2) / sectors : 0;

//                 if (ringIndex === lastRingIndex) {
//                     const emptySectors = sectorCounts[ringIndex].filter(count => count === 0).length;
//                     const remainingAngle = 2 * Math.PI - (minAngle * emptySectors);

//                     const angles = sectorCounts[ringIndex].map(count => {
//                         return count === 0 ? minAngle : (count / totalPoints) * remainingAngle;
//                     });

//                     sectorAngles[ringIndex] = angles;
//                 }
//                 else {
//                     const outerAngles = sectorAngles[ringIndex + 1];
//                     const innerSectors = 2 ** (ringIndex + 1);
//                     const outerSectors = 2 ** (ringIndex + 2);
//                     const ratio = outerSectors / innerSectors;

//                     const angles = [];
//                     for (let i = 0; i < innerSectors; i++) {
//                         let sumAngle = 0;
//                         for (let j = 0; j < ratio; j++) {
//                             const outerIdx = i * ratio + j;
//                             sumAngle += outerAngles[outerIdx];
//                         }
//                         angles.push(sumAngle);
//                     }

//                     sectorAngles[ringIndex] = angles;
//                 }
//             }

//             return sectorAngles;
//         };

//         const renderNormalView = () => {
//             subspaces.forEach((key, index) => {
//                 if (!ringVisibility[key]) return;
//                 const innerRadius = (index / subspaces.length) * maxRadius;
//                 const outerRadius = ((index + 1) / subspaces.length) * maxRadius;
//                 const sectors = 2 ** (index + 1);
//                 const rotationOffset = Math.PI / 2;

//                 const sectorCounts = calculateSectorPointCounts();
//                 const sectorsToRender = showEmptySectors ?
//                     Array.from({ length: sectors }, (_, i) => i) :
//                     Array.from({ length: sectors }, (_, i) => i).filter(i => sectorCounts[index][i] > 0);

//                 if (showEmptySectors) {
//                     for (let i = 0; i < sectors; i++) {
//                         const startAngle = (2 * Math.PI * i) / sectors + rotationOffset;
//                         const endAngle = (2 * Math.PI * (i + 1)) / sectors + rotationOffset;

//                         g.append("path")
//                             .attr("d", d3.arc()
//                                 .innerRadius(innerRadius)
//                                 .outerRadius(outerRadius)
//                                 .startAngle(startAngle)
//                                 .endAngle(endAngle)
//                             )
//                             .attr("fill", getSectorColor(index, i))
//                             .attr("fill-opacity", 0.3)
//                             .attr("stroke", "black")
//                             .attr("stroke-width", 0.5)
//                             .style("cursor", "pointer");
//                     }
//                 } else {
//                     const nonEmptySectors = sectorsToRender.length;
//                     sectorsToRender.forEach((sectorIndex, displayIndex) => {
//                         const startAngle = (2 * Math.PI * displayIndex) / nonEmptySectors + rotationOffset;
//                         const endAngle = (2 * Math.PI * (displayIndex + 1)) / nonEmptySectors + rotationOffset;

//                         g.append("path")
//                             .attr("d", d3.arc()
//                                 .innerRadius(innerRadius)
//                                 .outerRadius(outerRadius)
//                                 .startAngle(startAngle)
//                                 .endAngle(endAngle)
//                             )
//                             .attr("fill", getSectorColor(index, sectorIndex))
//                             .attr("fill-opacity", 0.3)
//                             .attr("stroke", "black")
//                             .attr("stroke-width", 0.5)
//                             .style("cursor", "pointer");
//                     });
//                 }

//                 g.append("text")
//                     .attr("x", 0)
//                     .attr("y", -outerRadius - 5)
//                     .attr("text-anchor", "middle")
//                     .attr("font-size", "16px")
//                     .attr("fill", "red")
//                     .attr("font-weight", "bold")
//                     .text(ringLabels[index]);

//                 renderPointsNormal(index, innerRadius, outerRadius, sectors, key);
//             });
//         };

//         const renderProportionalView = () => {
//             const sectorAngles = calculateRecursiveSectorAngles();
//             const rotationOffset = Math.PI / 2;

//             subspaces.forEach((key, index) => {
//                 if (!ringVisibility[key]) return;
//                 const innerRadius = (index / subspaces.length) * maxRadius;
//                 const outerRadius = ((index + 1) / subspaces.length) * maxRadius;

//                 let currentAngle = rotationOffset;
//                 sectorAngles[index].forEach((angle, i) => {
//                     if (!showEmptySectors && angle === 0) {
//                         return;
//                     }

//                     const startAngle = currentAngle;
//                     const endAngle = currentAngle + angle;

//                     g.append("path")
//                         .attr("d", d3.arc()
//                             .innerRadius(innerRadius)
//                             .outerRadius(outerRadius)
//                             .startAngle(startAngle)
//                             .endAngle(endAngle)
//                         )
//                         .attr("fill", getSectorColor(index, i))
//                         .attr("fill-opacity", 0.3)
//                         .attr("stroke", "black")
//                         .attr("stroke-width", 0.3)
//                         .style("cursor", "pointer");

//                     currentAngle = endAngle;
//                 });

//                 g.append("text")
//                     .attr("x", 0)
//                     .attr("y", -outerRadius - 5)
//                     .attr("text-anchor", "middle")
//                     .attr("font-size", "16px")
//                     .attr("fill", "red")
//                     .attr("font-weight", "bold")
//                     .text(ringLabels[index]);

//                 renderPointsProportional(index, innerRadius, outerRadius, sectorAngles[index], key);
//             });
//         };

//         const renderPointsNormal = (index, innerRadius, outerRadius, sectors, subspaceKey) => {
//             const rotationOffset = 0;
//             const sectorCounts = calculateSectorPointCounts();

//             if (showEmptySectors) {
//                 const anglePerSector = 2 * Math.PI / sectors;
//                 pointsData[index].points.forEach((point, i) => {
//                     const sectorIndex = getSectorIndex(point, subspaceKey);

//                     const startAngle = (anglePerSector * sectorIndex) + rotationOffset;
//                     const centerAngle = startAngle + (anglePerSector / 2);

//                     const totalPoints = pointsData[index].points.length;
//                     const clusterFactor = 0.9;
//                     const overlapRadius =
//                         innerRadius +
//                         (clusterFactor * (outerRadius - innerRadius) * (i % totalPoints)) /
//                         totalPoints;
//                     const x = overlapRadius * Math.cos(centerAngle);
//                     const y = overlapRadius * Math.sin(centerAngle);

//                     storePointPosition(point, x, y, index);
//                     drawPoint(point, x, y, index, subspaceKey);
//                 });
//             } else {
//                 const sectorsWithPoints = Array.from({ length: sectors }, (_, i) => i)
//                     .filter(i => sectorCounts[index][i] > 0);
//                 const nonEmptySectors = sectorsWithPoints.length;

//                 if (nonEmptySectors > 0) {
//                     const anglePerSector = 2 * Math.PI / nonEmptySectors;

//                     pointsData[index].points.forEach((point, i) => {
//                         const sectorIndex = getSectorIndex(point, subspaceKey);
//                         const displayIndex = sectorsWithPoints.indexOf(sectorIndex);
//                         if (displayIndex === -1) return;

//                         const startAngle = (anglePerSector * displayIndex) + rotationOffset;
//                         const centerAngle = startAngle + (anglePerSector / 2);

//                         const totalPoints = pointsData[index].points.length;
//                         const clusterFactor = 0.9;
//                         const overlapRadius =
//                             innerRadius +
//                             (clusterFactor * (outerRadius - innerRadius) * (i % totalPoints)) /
//                             totalPoints;
//                         const x = overlapRadius * Math.cos(centerAngle);
//                         const y = overlapRadius * Math.sin(centerAngle);

//                         storePointPosition(point, x, y, index);
//                         drawPoint(point, x, y, index, subspaceKey);
//                     });
//                 }
//             }
//         };

//         const renderPointsProportional = (index, innerRadius, outerRadius, sectorAngles, subspaceKey) => {
//             const rotationOffset = 0;
//             const pointsBySector = {};

//             pointsData[index].points.forEach(point => {
//                 const sectorIndex = getSectorIndex(point, subspaceKey);
//                 if (!pointsBySector[sectorIndex]) {
//                     pointsBySector[sectorIndex] = [];
//                 }
//                 pointsBySector[sectorIndex].push(point);
//             });

//             let currentAngle = rotationOffset;
//             const startAngles = sectorAngles.map((angle, i) => {
//                 const startAngle = currentAngle;
//                 currentAngle += angle;
//                 return startAngle;
//             });

//             Object.entries(pointsBySector).forEach(([sectorIndex, points]) => {
//                 const sectorIdx = parseInt(sectorIndex);
//                 const sectorAngle = sectorAngles[sectorIdx];

//                 if (!showEmptySectors && sectorAngle === 0) {
//                     return;
//                 }

//                 const startAngle = startAngles[sectorIdx];
//                 const centerAngle = startAngle + (sectorAngle / 2);

//                 points.forEach((point, i) => {
//                     const totalPointsInSector = points.length;
//                     const clusterFactor = 0.9;
//                     const overlapRadius =
//                         innerRadius +
//                         (clusterFactor * (outerRadius - innerRadius) * (i % Math.max(1, totalPointsInSector))) /
//                         Math.max(1, totalPointsInSector);

//                     const x = overlapRadius * Math.cos(centerAngle);
//                     const y = overlapRadius * Math.sin(centerAngle);

//                     storePointPosition(point, x, y, index);
//                     drawPoint(point, x, y, index, subspaceKey);
//                 });
//             });
//         };

//         const storePointPosition = (point, x, y, index) => {
//             point.Point_ID.forEach((id) => {
//                 if (!pointPositions[id]) {
//                     pointPositions[id] = [];
//                 }
//                 pointPositions[id].push({ x, y, point, subspaceId: pointsData[index].key });
//             });
//         };

//         const drawPoint = (point, x, y, index, subspaceKey) => {
//             g.append("circle")
//                 .attr("cx", x)
//                 .attr("cy", y)
//                 .attr("r", 3)
//                 .attr("fill", "black")
//                 .attr("stroke", "white")
//                 .attr("stroke-width", 0.5)
//                 .style("pointer-events", "visible")
//                 .on("mouseover", (event) => {
//                     const pointIds = point.Point_ID.join(", ");
//                     let associatedLabels = [];
//                     if (labelsData && labelsData.labels) {
//                         Object.entries(labelsData.labels).forEach(([label, pointList]) => {
//                             if (point.Point_ID.some(id => pointList.includes(Number(id)))) {
//                                 associatedLabels.push(label);
//                             }
//                         });
//                     }
//                     const labelText = associatedLabels.length > 0 ? associatedLabels.join(", ") : "No Label";

//                     // Get standardized coordinates for display
//                     const pointData = Object.entries(point).filter(([key]) => key !== "Point_ID");
//                     const standardizedCoords = pointData.map(([dim, coord]) => {
//                         const zScore = standardizeCoordinate(coord, subspaceKey, dim);
//                         return `${dim}: ${coord.toFixed(2)} (z=${zScore.toFixed(2)})`;
//                     }).join("<br>");

//                     tooltip
//                         .style("visibility", "visible")
//                         .html(
//                             `Point_IDs: ${pointIds}<br>Original coordinates:<br>${standardizedCoords}<br>Position: (${x.toFixed(2)}, ${y.toFixed(2)})<br>Subspace: ${pointsData[index].key}<br>Label: ${labelText}`
//                         );
//                     setHoveredCoordinates({ ...point, label: labelText });
//                 })
//                 .on("mousemove", (event) => {
//                     tooltip
//                         .style("top", event.pageY + 10 + "px")
//                         .style("left", event.pageX + 10 + "px");
//                 })
//                 .on("mouseout", () => {
//                     tooltip.style("visibility", "hidden");
//                     setHoveredCoordinates(null);
//                 });
//         };

//         if (viewMode === "normal") {
//             renderNormalView();
//         } else if (viewMode === "proportional") {
//             renderProportionalView();
//         }

//         Object.entries(pointPositions).forEach(([pointId, positions]) => {
//             if (positions.length > 1) {
//                 for (let i = 0; i < positions.length - 1; i++) {
//                     const line = g.append("line")
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

//         const zoom = d3.zoom().on("zoom", (event) => {
//             g.attr("transform", event.transform);
//         });
//         svg.call(zoom);

//         return () => {
//             tooltip.remove();
//         };
//     }, [jsonData, labelsData, ringVisibility, setHoveredCoordinates, viewMode, showEmptySectors]);

//     return (
//         <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
//             <div style={{ marginBottom: "10px" }}>
//                 <button
//                     onClick={() => setViewMode("normal")}
//                     style={{
//                         marginRight: "10px",
//                         padding: "5px 10px",
//                         backgroundColor: viewMode === "normal" ? "#4CAF50" : "#f0f0f0",
//                         color: viewMode === "normal" ? "white" : "black",
//                         border: "1px solid #ccc",
//                         borderRadius: "4px",
//                         cursor: "pointer"
//                     }}
//                 >
//                     Normal View
//                 </button>
//                 <button
//                     onClick={() => setViewMode("proportional")}
//                     style={{
//                         marginRight: "10px",
//                         padding: "5px 10px",
//                         backgroundColor: viewMode === "proportional" ? "#4CAF50" : "#f0f0f0",
//                         color: viewMode === "proportional" ? "white" : "black",
//                         border: "1px solid #ccc",
//                         borderRadius: "4px",
//                         cursor: "pointer"
//                     }}
//                 >
//                     Proportional View
//                 </button>
//                 <button
//                     onClick={() => setShowEmptySectors(!showEmptySectors)}
//                     style={{
//                         padding: "5px 10px",
//                         backgroundColor: showEmptySectors ? "#2196F3" : "#ff9800",
//                         color: "white",
//                         border: "1px solid #ccc",
//                         borderRadius: "4px",
//                         cursor: "pointer"
//                     }}
//                 >
//                     {showEmptySectors ? "Hide Empty Sectors" : "Show Empty Sectors"}
//                 </button>
//             </div>

//             <div style={{ marginBottom: "10px", padding: "10px", backgroundColor: "#f5f5f5", borderRadius: "4px" }}>
//                 <strong>Z-Score Classification:</strong> Points are now classified into sectors based on whether each dimension is above (≥0) or below (&lt;0) the mean after standardization using z-scores: (value - mean) / standard deviation.
//             </div>

//             <svg ref={graphRef} style={{ width: "100%", height: "800px" }}></svg>

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
