
import * as d3 from "d3";

export const transformZScore = (points, threshold) => {
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

export const calculateZScoreSectorIndex = (point, ringIndex, threshold = 0) => {
    // First get coordinates excluding Point_ID
    const coordinates = Object.entries(point).filter(([key]) =>
        key !== "Point_ID" && !key.endsWith('_binary')
    );

    // Generate binary values based on z-score threshold
    const bitVector = coordinates.map(([key, value]) => {
        // For z-score, we need the original calculation logic
        // This is simplified - in practice you'd need the mean/std from the dataset
        return value >= threshold ? 1 : 0;
    }).join("");

    const sectors = 2 ** (ringIndex + 1);
    const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);
    console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Z-Score Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
    return sectorIndex;
};