import { useEffect, useRef } from 'react';

export function BinaryRainBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const intervalRef = useRef<number | null>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas to match parent container size
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.offsetWidth;
                canvas.height = parent.offsetHeight;
            }
        };

        resizeCanvas();

        // Configuration (from provided HTML/JS)
        const fontSize = 16;
        const color = '#0F0'; // Classic Matrix Green
        const speed = 50; // Lower is faster, Higher is slower (50 is moderate)

        // The characters (Binary only)
        const binary = "10";
        const characters = binary.split("");

        // Calculate how many columns fit on screen
        let columns = Math.floor(canvas.width / fontSize);

        // An array of drops - one per column
        let drops: number[] = [];

        // Initialize drops
        for (let x = 0; x < columns; x++) {
            drops[x] = 1;
        }

        // Draw function
        function draw() {
            if (!ctx || !canvas) return;

            // Translucent black background to create the "trail" effect
            // 0.05 opacity makes trails long, 0.1 makes them short
            ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.fillStyle = color;
            ctx.font = fontSize + 'px monospace';

            // Loop through drops
            for (let i = 0; i < drops.length; i++) {
                // Pick a random '0' or '1'
                const text = characters[Math.floor(Math.random() * characters.length)];

                // Draw the character
                // x = column index * font size, y = drop value * font size
                ctx.fillText(text, i * fontSize, drops[i] * fontSize);

                // Reset drop to top randomly after it has crossed screen
                // Math.random() > 0.975 adds randomness so they don't all fall together
                if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                // Increment y coordinate
                drops[i]++;
            }
        }

        // Animation Loop
        intervalRef.current = window.setInterval(draw, speed);

        // Handle Window Resize (Responsive)
        const handleResize = () => {
            resizeCanvas();
            columns = Math.floor(canvas.width / fontSize);
            drops = [];
            for (let x = 0; x < columns; x++) {
                drops[x] = 1;
            }
        };

        // Performance: Pause animation when tab is hidden
        const handleVisibilityChange = () => {
            if (document.hidden) {
                if (intervalRef.current !== null) {
                    clearInterval(intervalRef.current);
                    intervalRef.current = null;
                }
            } else {
                if (intervalRef.current === null) {
                    intervalRef.current = window.setInterval(draw, speed);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup on unmount
        return () => {
            if (intervalRef.current !== null) {
                clearInterval(intervalRef.current);
            }
            window.removeEventListener('resize', handleResize);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'absolute',
                inset: 0,
                zIndex: 0,
                pointerEvents: 'none',
                opacity: 0.25,
            }}
        />
    );
}
