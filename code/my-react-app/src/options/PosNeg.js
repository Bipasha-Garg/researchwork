
export const transformPositiveNegative = (points) => {
    return points.map(point => {
        const transformedPoint = { ...point };
        const coordinates = Object.entries(point).filter(([key]) => key !== "Point_ID");

        coordinates.forEach(([key, value]) => {
            transformedPoint[`${key}_binary`] = value >= 0 ? 1 : 0;
        });

        return transformedPoint;
    });
};

export const calculatePositiveNegativeSectorIndex = (point, ringIndex, useTransformed = true) => {
    const coordinates = Object.entries(point).filter(([key]) => {
        if (useTransformed) {
            return key.endsWith('_binary');
        }
        return key !== "Point_ID" && !key.endsWith('_binary');
    });

    let bitVector;
    if (useTransformed) {
        bitVector = coordinates.map(([_, value]) => value).join("");
    } else {
        bitVector = coordinates.map(([_, value]) => (value >= 0 ? 1 : 0)).join("");
    }

    const sectors = 2 ** (ringIndex + 1);
    const sectorIndex = Math.min(parseInt(bitVector, 2), sectors - 1);
    console.log(`Point ${point.Point_ID}, Ring ${ringIndex}, Bit Vector: ${bitVector}, Sector: ${sectorIndex}`);
    return sectorIndex;
};