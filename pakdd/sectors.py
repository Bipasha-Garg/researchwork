import matplotlib.pyplot as plt
from matplotlib.patches import Wedge, Circle
import matplotlib.colors as mcolors
import math
import numpy as np

# ------------------------------------------------------------
# COLORS — UNCHANGED
# ------------------------------------------------------------
ring_colors = [
    # "#FFF8A8",  # d_1 (inner circle, ring 1)
    "#C8D645",  # d_2 (ring 2)
    "#E9A03F",  # d_3 (ring 3)
    # "#B45A1A",  # d_4
    "#EBA3E9",  # d_5
    # "#A43FCA",  # d_6
    "#5A1A9A",  # d_7
]

num_layers = len(ring_colors)
ring_width = 1.0
inner_circle_radius = 0.5

ring_label_angle_deg = 90
ring_label_angle_rad = math.radians(ring_label_angle_deg)

label_fontsize = 14
label_fontweight = "bold"

output_path = "label_sectors.svg"


# ------------------------------------------------------------
# UTILITIES
# ------------------------------------------------------------
def lighten(color, factor=0.3):
    c = mcolors.to_rgb(color)
    return tuple(1 - (1 - ch) * (1 - factor) for ch in c)


def darken(color, factor=0.3):
    c = mcolors.to_rgb(color)
    return tuple(ch * (1 - factor) for ch in c)


def readable_label_color(hexcolor):
    r, g, b = mcolors.to_rgb(hexcolor)
    lum = 0.2126 * r + 0.7152 * g + 0.0722 * b
    return "black" if lum > 0.55 else "white"


# ------------------------------------------------------------
# PLOT INIT
# ------------------------------------------------------------
fig, ax = plt.subplots(figsize=(8, 8))
fig.patch.set_alpha(0)
ax.patch.set_alpha(0)
ax.set_aspect("equal")
ax.axis("off")

max_radius = inner_circle_radius + (num_layers - 1) * ring_width
ax.set_xlim(-max_radius, max_radius)
ax.set_ylim(-max_radius, max_radius)


# ------------------------------------------------------------
# LOOP THROUGH RINGS INCLUDING INNERMOST
# ------------------------------------------------------------
for i in range(num_layers):

    base_color = ring_colors[i]

    # ------------------------------------------------------------
    # SPECIAL CASE: INNERMOST CIRCLE (horizontal split)
    # ------------------------------------------------------------
    if i == 0:
        r_inner = 0
        r_outer = inner_circle_radius

        sectors = 2
        d_theta = 180

        for j in range(sectors):
            theta1 = 0 + j * d_theta
            theta2 = theta1 + d_theta

            shade = (
                darken(base_color, 0.25) if (j % 2 == 0) else lighten(base_color, 0.35)
            )

            wedge = Wedge(
                (0, 0),
                r_outer,
                theta1=theta1,
                theta2=theta2,
                width=r_outer - r_inner,
                facecolor=shade,
                edgecolor="black",
                linewidth=0.6,
            )
            ax.add_patch(wedge)

        # inner circle label
        mid_r = r_outer / 2
        # ax.text(
        #     mid_r * math.cos(ring_label_angle_rad),
        #     mid_r * math.sin(ring_label_angle_rad),
        #     r"$d_{b1}$",
        #     ha="center",
        #     va="center",
        #     fontsize=label_fontsize,
        #     fontweight=label_fontweight,
        #     color=readable_label_color(base_color),
        # )
        continue

    # ------------------------------------------------------------
    # OUTER RINGS
    # ------------------------------------------------------------
    r_inner = inner_circle_radius + (i - 1) * ring_width
    r_outer = r_inner + ring_width

    ring_number = i + 1
    sectors = 2**ring_number
    d_theta = 360 / sectors

    for j in range(sectors):

        # start just below 3 o'clock
        theta1 = -90 - j * d_theta
        theta2 = theta1 + d_theta

        # ------------------------------------------------------------
        # ★ NEW RULE: SPECIAL SHADING FOR RING 2 (b2)
        # ------------------------------------------------------------
        if ring_number == 2:
            bit_label = format(j, "02b")  # 00,01,10,11

            if bit_label in ("01", "11"):  # dark
                shade = darken(base_color, 0.25)
            else:  # 00, 10 (light)
                shade = lighten(base_color, 0.35)
        else:
            # original alternating shading
            shade = (
                darken(base_color, 0.25) if (j % 2 == 0) else lighten(base_color, 0.35)
            )

        wedge = Wedge(
            (0, 0),
            r_outer,
            theta1=theta1,
            theta2=theta2,
            width=(r_outer - r_inner),
            facecolor=shade,
            edgecolor="black",
            linewidth=0.6,
        )
        ax.add_patch(wedge)

        # bit labels only for ring 2 & 3
        # NEW: Sector labels S_(d_b_i),j for ALL rings except inner circle
        if ring_number == 2:
            sector_label = r"$S_{d_{b" + str(ring_number) + "},{" + str(j+1) + "}}$"

            mid_angle_deg = theta1 + d_theta / 2
            mid_angle = math.radians(mid_angle_deg)

            mid_r = r_inner + (r_outer - r_inner) * 0.55
            x = mid_r * math.cos(mid_angle)
            y = mid_r * math.sin(mid_angle)

            # ax.text(
            #     x,
            #     y,
            #     sector_label,
            #     ha="center",
            #     va="center",
            #     fontsize=9,
            #     fontweight="bold",
            #     color="black",
            # )

    # ring label
    mid_r_ring = r_inner + (r_outer - r_inner) / 2
    # ax.text(
    #     mid_r_ring * math.cos(ring_label_angle_rad),
    #     mid_r_ring * math.sin(ring_label_angle_rad),
    #     rf"$d_{{b{ring_number}}}$",
    #     ha="center",
    #     va="center",
    #     fontsize=label_fontsize,
    #     fontweight=label_fontweight,
    #     color=readable_label_color(base_color),
    # )


# ------------------------------------------------------------
# SAVE
# ------------------------------------------------------------
plt.savefig(output_path, format="svg", dpi=300, transparent=True)
plt.show()

print("Saved:", output_path)
