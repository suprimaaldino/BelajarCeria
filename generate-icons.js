/**
 * Icon Generator for Belajar Ceria PWA
 * Run with: node generate-icons.js
 * Or just open generate-icons.html in browser
 */

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

function generateIcon(size) {
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(0.5, '#764ba2');
    gradient.addColorStop(1, '#f093fb');

    // Draw rounded square background
    const radius = size * 0.2;
    ctx.beginPath();
    ctx.roundRect(0, 0, size, size, radius);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw emoji
    ctx.font = `${size * 0.5}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('📚', size / 2, size / 2);

    return canvas.toDataURL('image/png');
}

// Generate all icons and trigger download
function downloadAllIcons() {
    sizes.forEach(size => {
        const dataUrl = generateIcon(size);
        const link = document.createElement('a');
        link.download = `icon-${size}.png`;
        link.href = dataUrl;
        link.click();
    });
}
