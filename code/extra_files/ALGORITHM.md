# HierarchicalGraph Component: Algorithm and Computational Complexity Analysis

The `HierarchicalGraph` React component visualizes high-dimensional data using a hierarchical, radial (circular) layout with accompanying linear strip visualizations. It leverages D3.js for rendering and supports two view modes: "normal" and "proportional." Below is an overview of the algorithms used and their computational complexity.

## Algorithms Used

1. **Data Preprocessing and Sorting**
   - **Description**: Processes `jsonData` (a dictionary of subspaces with points) and `labelsData` (point labels). Subspaces sub sorted by their dimensionality (length of subspace key) to ensure inner-to-outer ring ordering in the radial layout.
   - **Algorithm**: Sorting subspaces by length.
   - **Purpose**: Organizes subspaces hierarchically for visualization.

2. **Sector Assignment**
   - **Description**: Converts point coordinates into a binary vector (bit vector) based on whether each coordinate is non-negative (1) or negative (0). This determines the sector index within a ring.
   - **Algorithm**: Iterates through points, computes bit vectors, and assigns points to sectors ($2^{\text{ringIndex} + 1}$ sectors per ring).
   - **Purpose**: Groups points into sectors based on coordinate signs for spatial organization.

3. **Radial Layout (Normal View)**
   - **Sector Rendering**: Divides each ring into $2^{\text{ringIndex} + 1}$ sectors, each with equal angular portions ($2\pi/\text{sectors}$). Sectors are drawn as arcs using D3’s arc generator.
   - **Point Placement**: Places points radially within a sector, using a cluster factor to avoid overlap.
   - **Algorithm**: Uniform angular distribution for sectors; linear radial distribution for points.
   - **Purpose**: Provides a consistent, evenly spaced circular layout.

4. **Radial Layout (Proportional View)**
   - **Recursive Sector Angle Calculation**: Allocates sector angles proportionally based on point counts in the outermost ring, with minimum angles for empty sectors. Inner rings inherit angles from outer rings, scaled by sector ratio.
   - **Point Placement**: Places points at the sector’s center angle, with radial positions adjusted to avoid overlap.
   - **Algorithm**: Recursive angle propagation; proportional angle allocation.
   - **Purpose**: Emphasizes densely populated sectors with larger angles.

5. **Linear Strip Visualization**
   - **Sector Rendering**: Arranges sectors horizontally per ring. In "normal" view, sectors have equal width; in "proportional" view, widths are proportional to point counts (minimum width for empty sectors).
   - **Point Placement**: Places points along horizontal lines within sectors, with x-positions based on normalized average absolute coordinate values.
   - **Algorithm**: Linear sector arrangement; normalized point placement.
   - **Purpose**: Provides a linear perspective of the data.

6. **Point Connection Across Rings**
   - **Description**: Connects points with the same `Point_ID` across subspaces (rings) with lines, colored by point labels.
   - **Algorithm**: Iterates through point positions, drawing lines between consecutive positions of the same point ID.
   - **Purpose**: Highlights relationships across subspaces.

7. **Interactivity**
   - **Tooltip Handling**: Displays point details (ID, coordinates, subspace, label) on hover using D3’s event handling.
   - **Zooming**: Implements D3’s zoom behavior for scaling and panning.
   - **Algorithm**: Event-driven updates for tooltips and transformations.
   - **Purpose**: Enhances user interaction and data exploration.

8. **Empty Sector Handling**
   - **Description**: Toggles rendering of empty sectors via `showEmptySectors`. In "normal" view, skips empty sectors if false, adjusting angles/widths. In "proportional" view, assigns minimal angles/widths to empty sectors.
   - **Algorithm**: Filters sectors based on point counts; adjusts rendering dynamically.
   - **Purpose**: Reduces visual clutter by optionally hiding empty sectors.

## Computational Complexity Analysis

**Notation**:
- $N$: Total number of points across all subspaces.
- $S$: Number of subspaces (rings).
- $P_{\text{max}}$: Maximum number of points in any single subspace.
- $D_{\text{max}}$: Maximum dimensionality of any subspace.
- $L$: Number of unique labels in `labelsData`.
- $K_{\text{max}}$: Maximum number of sectors in any ring ($2^{S+1}$ for the outermost ring).

1. **Data Preprocessing and Sorting**
   - Sorting subspaces: $O(S \log S)$.
   - Processing points for `pointsData`: $O(N \cdot D_{\text{max}})$.
   - **Total**: $O(S \log S + N \cdot D_{\text{max}})$.

2. **Sector Assignment**
   - Bit vector computation: $O(N \cdot D_{\text{max}})$.
   - Assigning points to sectors: $O(N)$.
   - **Total**: $O(N \cdot D_{\text{max}})$.

3. **Radial Layout (Normal View)**
   - **Sector Rendering**: Total sectors across rings: $\sum_{i=0}^{S-1} 2^{i+1} \approx 2^{S+1}$. Rendering arcs: $O(K_{\text{max}})$.
   - **Point Placement**: $O(P_{\text{max}})$ per ring, so $O(N)$ total.
   - **Total**: $O(K_{\text{max}} + N)$.

4. **Radial Layout (Proportional View)**
   - **Sector Angle Calculation**: Sector counts: $O(N \cdot D_{\text{max}})$. Recursive angle propagation: $O(K_{\text{max}})$.
   - **Sector Rendering**: $O(K_{\text{max}})$.
   - **Point Placement**: $O(N)$.
   - **Total**: $O(N \cdot D_{\text{max}} + K_{\text{max}} + N)$.

5. **Linear Strip Visualization**
   - **Sector Rendering**: $O(K_{\text{max}})$.
   - **Point Placement**: $O(P_{\text{max}} \cdot D_{\text{max}})$ per ring, so $O(N \cdot D_{\text{max}})$ total.
   - **Total**: $O(K_{\text{max}} + N \cdot D_{\text{max}})$.

6. **Point Connection Across Rings**
   - Drawing lines for each point across subspaces: $O(N \cdot S)$.
   - **Total**: $O(N \cdot S)$.

7. **Label Color Assignment**
   - Checking label membership: $O(N \cdot L)$.
   - **Total**: $O(N \cdot L)$.

8. **Interactivity**
   - Tooltip and zoom events: Constant time per event, negligible.
   - **Total**: Negligible.

## Overall Complexity
- **Dominant Steps**:
  - Preprocessing: $O(S \log S + N \cdot D_{\text{max}})$.
  - Sector assignment: $O(N \cdot D_{\text{max}})$.
  - Rendering (both views): $O(K_{\text{max}} + N \cdot D_{\text{max}})$.
  - Point connections: $O(N \cdot S)$.
  - Label assignment: $O(N \cdot L)$.
- **Combined Complexity**: $$O(S \log S + N \cdot D_{\text{max}} + K_{\text{max}} + N \cdot S + N \cdot L)$$.
  - $K_{\text{max}} = 2^{S+1}$ (exponential in number of subspaces).
  - $D_{\text{max}}$ is typically small.
  - $L$ is often smaller than $N$.
  - For small $S$, dominant terms are $O(N \cdot D_{\text{max}})$ or $O(N \cdot S)$.

## Notes
- **Performance Considerations**: The exponential growth of sectors ($K_{\text{max}} = 2^{S+1}$) can be a bottleneck for large $S$. Hiding empty sectors mitigates this.
- **Scalability**: Scales well for moderate $S$ and $N$, but high-dimensional data or many subspaces may degrade performance.
- **Optimization Opportunities**: Caching sector counts, precomputing bit vectors, or using efficient data structures (e.g., hash maps for labels) could improve performance.

For specific data characteristics (e.g., large $S$, sparse data), the analysis can be refined further.