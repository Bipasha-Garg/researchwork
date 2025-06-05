
import * as d3 from "d3";

export const transformPercentile = (points, percentile) => {
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

export const calculatePercentileSectorIndex = (point, ringIndex, percentile = 50) => {
    const coordinates = Object.entries(point).filter(([key]) =>
        key !== "Point_ID" && !key.endsWith('_binary')
    );

    // Generate binary values based on percentile threshold
    const bitVector = coordinates.map(([key, value]) => {
        // Simplified percentile calculation - in practice you'd need the dataset percentiles
        return value >= 0 ? 1 : 0; // Placeholder logic
    }).join("");

    const sectors = 2 ** (ringIndex + 1);
    const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);
    console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Percentile Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
    return sectorIndex;
};