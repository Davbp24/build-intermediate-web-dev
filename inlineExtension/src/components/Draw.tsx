function Draw() {
  return (
    <div className="draw-screen">
      <h2>Draw Tool</h2>
      <p>Use the canvas below to draw and annotate directly on the page.</p>
      <canvas className="draw-canvas" width={800} height={600} style={{ border: '1px solid #ccc' }}></canvas>
    </div>
  );
}

export default Draw;