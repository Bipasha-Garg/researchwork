// CHANGE: Export the download functions to resolve Webpack module confusion.
export const downloadSVG = (svgElement, filename = "visualization.svg") => {
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();

    URL.revokeObjectURL(url);
};

// CHANGE: Export the download functions to resolve Webpack module confusion.
export function downloadPNG(svgNode) {
    const svgString = new XMLSerializer().serializeToString(svgNode);

    // Fix: Encode SVG with UTF-8 safe method
    const svg64 = window.btoa(unescape(encodeURIComponent(svgString)));
    const image64 = "data:image/svg+xml;base64," + svg64;

    const img = new Image();
    img.onload = function () {
        const canvas = document.createElement("canvas");
        canvas.width = svgNode.clientWidth * 2;   // higher resolution
        canvas.height = svgNode.clientHeight * 2;
        const ctx = canvas.getContext("2d");

        // white background for PNG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const png = canvas.toDataURL("image/png");

        const link = document.createElement("a");
        link.download = "visualization.png";
        link.href = png;
        link.click();
    };

    img.src = image64;
}


// CHANGE: Export the download functions to resolve Webpack module confusion.
export function downloadEPS(svgNode) {
    if (!svgNode) {
        console.error("No SVG found for EPS export.");
        return;
    }

    // Serialize the SVG
    const svgString = new XMLSerializer().serializeToString(svgNode);

    // EPS header (PostScript wrapper)
    const epsHeader = `%!PS-Adobe-3.0 EPSF-3.0
%%Creator: React-D3 Visualization
%%Title: Exported Visualization
%%Pages: 1
%%BoundingBox: 0 0 ${svgNode.clientWidth} ${svgNode.clientHeight}
%%EndComments

`;

    // Convert SVG into EPS-compatible representation
    // We embed the SVG XML directly inside the EPS file as a string.
    const epsContent =
        epsHeader +
        "%%BeginDocument: SVG\n" +
        svgString +
        "\n%%EndDocument\n%%EOF";

    // Create blob
    const blob = new Blob([epsContent], {
        type: "application/postscript"
    });

    // Trigger download
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "visualization.eps";
    a.click();
    URL.revokeObjectURL(url);
}

export default { downloadSVG, downloadPNG, downloadEPS };