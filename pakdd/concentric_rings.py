import matplotlib.pyplot as plt
from matplotlib.patches import Wedge, Circle
import matplotlib.colors as mcolors
import math

# ---------- PARAMETERS ----------
# ring_colors = [
#     "#FFF8A8",  # d_1 (inner circle)
#     "#C8D645",  # d_2
#     "#E9A03F",  # d_3
#     "#B45A1A",  # d_4
#     "#EBA3E9",  # d_5
#     "#A43FCA",  # d_6
#     "#5A1A9A",  # d_7
# ]

ring_colors = [
    # "#FFF8A8",  # d_1 (inner circle, ring 1)
    "#C8D645",  # d_2 (ring 2)
    "#E9A03F",  # d_3 (ring 3)
    # "#B45A1A",  # d_4
    "#EBA3E9",  # d_5
    # "#A43FCA",  # d_6
    "#5A1A9A",  # d_7
]

num_layers = len(ring_colors)  # includes inner circle
ring_width = 1.0
inner_circle_radius = 0.5
label_angle_deg = 90  # for rings only
label_fontsize = 14
label_fontweight = "bold"

output_path = "conc_ring_db.svg"


# ---------- UTIL: choose label color ----------
def readable_label_color(hexcolor):
    r, g, b = mcolors.to_rgb(hexcolor)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return "black" if lum > 0.55 else "white"


# ---------- PLOT ----------
fig, ax = plt.subplots(figsize=(8, 8))
fig.patch.set_alpha(0)
ax.patch.set_alpha(0)

ax.set_aspect("equal")
ax.axis("off")

max_radius = inner_circle_radius + (num_layers - 1) * ring_width
ax.set_xlim(-max_radius, max_radius)
ax.set_ylim(-max_radius, max_radius)

# -------- 1. DRAW INNER CIRCLE --------
inner_color = ring_colors[0]
circle = Circle(
    (0, 0), inner_circle_radius, facecolor=inner_color, edgecolor="black", linewidth=1
)
ax.add_patch(circle)

# Label for inner circle placed at center
ax.text(
    0,
    0,
    r"$d_{b1}$",
    ha="center",
    va="center",
    fontsize=label_fontsize,
    fontweight=label_fontweight,
    color=readable_label_color(inner_color),
)

# -------- 2. DRAW RINGS OUTWARD --------
angle_rad = math.radians(label_angle_deg)

for i in range(1, num_layers):
    color = ring_colors[i]

    r_inner = inner_circle_radius + (i - 1) * ring_width
    r_outer = r_inner + ring_width

    ring = Wedge(
        (0, 0),
        r_outer,
        theta1=0,
        theta2=360,
        width=ring_width,
        facecolor=color,
        edgecolor="black",
        linewidth=1,
    )
    ax.add_patch(ring)

    # label position for rings
    mid_r = r_inner + ring_width / 2
    x = mid_r * math.cos(angle_rad)
    y = mid_r * math.sin(angle_rad)

    ax.text(
        x,
        y,
        rf"$d_{{b{i+1}}}$",
        ha="center",
        va="center",
        fontsize=label_fontsize,
        fontweight=label_fontweight,
        color=readable_label_color(color),
    )

# Save transparent SVG
plt.savefig(output_path, format="svg", dpi=300, transparent=True)
plt.show()

print("Saved:", output_path)
