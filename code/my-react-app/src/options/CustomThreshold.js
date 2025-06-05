
export const transformCustomThreshold = (points, threshold) => {
    return points.map(point => {
        const transformedPoint = { ...point };
        const coordinates = Object.entries(point).filter(([key]) => key !== "Point_ID");

        coordinates.forEach(([key, value]) => {
            transformedPoint[`${key}_binary`] = value >= threshold ? 1 : 0;
        });

        return transformedPoint;
    });
};

export const calculateCustomThresholdSectorIndex = (point, ringIndex, threshold = 0) => {
    const coordinates = Object.entries(point).filter(([key]) =>
        key !== "Point_ID" && !key.endsWith('_binary')
    );

    const bitVector = coordinates.map(([_, value]) => (value >= threshold ? 1 : 0)).join("");

    const sectors = 2 ** (ringIndex + 1);
    const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);
    console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Custom Threshold Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
    return sectorIndex;
};