import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-screen">
    {/* Top Navigation */}
        <div className="top-bar">
            <img src="https://via.placeholder.com/150" alt="Logo" className="logo" />
            <h1 className="app-name">Inline</h1>
            <button className="settings-button">Settings</button>
            <button className='back-button' onClick={() => navigate('/')}>Back</button>
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