import { useNavigate } from 'react-router-dom';


function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-screen">
    {/* Top Navigation */}
        <div className="top-bar">
          <div className="top-bar__left">
            <div className="top-bar__icon">
            </div>
            <h1 className="app-name">Inline</h1>
          </div>
          <div className="top-bar__right">
            <button className="top-bar__action" aria-label="Settings">
            </button>
            <button className="top-bar__action top-bar__action--circle" aria-label="Go back" onClick={() => navigate('/')}>
            </button>
          </div>
      </div>
      
      {/* Main Content */}
    
        <div className="content">
        <h2>Make every page truly yours</h2>
        <p>Pick a tool. Customize anything. Drag and drop elements to create your perfect page.</p>
        </div>
      
      {/* Bottom Navigation */}
      <div className="bottom-bar">
        <button onClick={() => navigate('/notes')}>Notes</button>
        <button onClick={() => navigate('/draw')}>Draw</button>
        <button onClick={() => navigate('/rewrite')}>Rewrite</button>
        <button onClick={() => navigate('/ai')}>AI</button>
        <button onClick={() => navigate('/highlighter')}>Highlighter</button>
      </div>
    </div>
  );
}

export default Home;