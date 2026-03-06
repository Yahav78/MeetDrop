export default function RadarLoading() {
  return (
    <div className="radar-container">
      <div className="radar">
        <div className="radar-dot"></div>
      </div>
      <div>
        <h3 className="loading-title">Scanning the area...</h3>
        <p className="loading-desc">Waiting for someone nearby to connect. <br/>Timeout in 10s.</p>
      </div>
    </div>
  );
}
