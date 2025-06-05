
import * as d3 from "d3";

export const transformRadial = (points, options = {}) => {
    if (!points || points.length === 0) {
        console.warn('No points provided for radial transformation');
        return points;
    }

    // Get all keys from the first point
    const keys = Object.keys(points[0]);
    // Filter for numerical features, excluding Point_ID
    const numericalKeys = keys.filter(key => key !== 'Point_ID' && typeof points[0][key] === 'number');
    // Select the last numerical feature
    const feature = numericalKeys[numericalKeys.length - 1];
    if (!feature) {
        console.warn('No numerical feature found for radial transformation');
        return points;
    }

    // Calculate min and max for the selected feature within this ring
    const values = points.map(p => p[feature]);
    const minValue = d3.min(values);
    const maxValue = d3.max(values);
    const range = maxValue - minValue || 1; // Avoid division by zero

    console.log(`Radial Transform - Feature: ${feature}, Min: ${minValue}, Max: ${maxValue}, Range: ${range}`);

    return points.map((point, index) => {
        const transformedPoint = { ...point };
        const value = point[feature];
        // Normalize value to [0, 1] and map to [0, 359°] in radians
        const normalized = (value - minValue) / range;
        const angle = normalized * (360 * Math.PI / 180); // Convert 360 to radians
        transformedPoint.angle = angle;
        console.log(`Point ${point.Point_ID}, Value: ${value}, Normalized: ${normalized.toFixed(3)}, Angle: ${(angle * 180 / Math.PI).toFixed(2)}°`);
        return transformedPoint;
    });
};
export const calculateRadialPointPositions = (
    points,
    ringIndex,
    innerRadius,
    outerRadius,
    rotationOffset = Math.PI / 2
) => {
    console.log(`Calculating radial positions for ring ${ringIndex}, points: ${points.length}, innerRadius: ${innerRadius}, outerRadius: ${outerRadius}`);
    
    const positions = [];
    
    points.forEach((point, pointIndex) => {
        const angle = point.angle !== undefined ? point.angle + rotationOffset : rotationOffset;

        // Distribute points radially within the ring
        const numPoints = points.length;
        let radius;
        if (numPoints <= 1) {
            radius = (innerRadius + outerRadius) / 2;
        } else {
            const radiusStep = (outerRadius - innerRadius) / numPoints;
            radius = innerRadius + (radiusStep * pointIndex);
        }

        radius = Math.max(innerRadius, Math.min(outerRadius, radius));

        // Anticlockwise: x = cos(angle), y = sin(angle)
        const x = radius * Math.cos(angle);
        const y = radius * Math.sin(angle);

        if (isNaN(x) || isNaN(y)) {
            console.warn(`Invalid position for point ${point.Point_ID}: radius=${radius}, angle=${(angle * 180 / Math.PI).toFixed(2)}°, x=${x}, y=${y}`);
            return;
        }

        positions.push({
            point: point,
            transformedPoint: point,
            x,
            y,
            sectorIndex: 0, // No sectors in radial mode
            angle
        });

        console.log(`Point ${point.Point_ID} at ring ${ringIndex}: angle=${(angle * 180 / Math.PI).toFixed(2)}°, x=${x.toFixed(2)}, y=${y.toFixed(2)}, radius=${radius.toFixed(2)}`);
    });

    return positions;
};