import { useRef, useEffect, useState } from 'react';

const SignaturePad = ({ value, onChange, width = 300, height = 150 }) => {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [ctx, setCtx] = useState(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        context.lineWidth = 2;
        context.lineCap = 'round';
        context.strokeStyle = '#000';
        setCtx(context);

        // Load existing signature if provided
        if (value) {
            const img = new Image();
            img.onload = () => {
                context.drawImage(img, 0, 0);
            };
            img.src = value;
        }
    }, []);

    const startDrawing = (e) => {
        const { offsetX, offsetY } = getCoordinates(e);
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { offsetX, offsetY } = getCoordinates(e);
        ctx.lineTo(offsetX, offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (isDrawing) {
            ctx.closePath();
            setIsDrawing(false);
            if (onChange) {
                onChange(canvasRef.current.toDataURL());
            }
        }
    };

    const getCoordinates = (e) => {
        if (e.touches && e.touches[0]) {
            const rect = canvasRef.current.getBoundingClientRect();
            return {
                offsetX: e.touches[0].clientX - rect.left,
                offsetY: e.touches[0].clientY - rect.top
            };
        }
        return {
            offsetX: e.nativeEvent.offsetX,
            offsetY: e.nativeEvent.offsetY
        };
    };

    const clearSignature = () => {
        ctx.clearRect(0, 0, width, height);
        if (onChange) {
            onChange('');
        }
    };

    return (
        <div style={{ display: 'inline-block', border: '1px solid #ccc', backgroundColor: '#fff' }}>
            <canvas
                ref={canvasRef}
                width={width}
                height={height}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ touchAction: 'none', display: 'block' }}
            />
            <div style={{ borderTop: '1px solid #ccc', padding: '5px', textAlign: 'right', backgroundColor: '#f9f9f9' }}>
                <button type="button" onClick={clearSignature} style={{ padding: '2px 8px', fontSize: '12px', cursor: 'pointer' }}>
                    Clear
                </button>
            </div>
        </div>
    );
};

export default SignaturePad;
