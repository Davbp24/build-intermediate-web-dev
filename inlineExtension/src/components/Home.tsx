<<<<<<< Updated upstream
import { useNavigate } from 'react-router-dom';

=======
import { useNavigate } from "react-router-dom";
import { DiAptana } from "react-icons/di";
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { FaPencil } from "react-icons/fa6";


import "./Home.css";
>>>>>>> Stashed changes

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-screen">
    {/* Top Navigation */}
        <div className="top-bar">
<<<<<<< Updated upstream
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
=======
          <div className="logo-container">
            <div className="logo" aria-label="Logo"><FaPencil /></div>
            <h1 className="app-name">Inline</h1>
          </div>
           <div className="nav-buttons">
            <button onClick={() => navigate('/settings')} className="settings-button"><DiAptana /></button>
            <button className='back-button' onClick={() => navigate('/')}><IoIosArrowDroprightCircle /></button>
           </div>
            
        </div>
>>>>>>> Stashed changes
      
      {/* Main Content */}
    
        <div className="content">
        <h2>Make every page truly yours</h2>
<<<<<<< Updated upstream
        <p>Pick a tool. Customize anything. Drag and drop elements to create your perfect page.</p>
        </div>
      
      {/* Bottom Navigation */}
      <div className="bottom-bar">
        <button onClick={() => navigate('/notes')}>Notes</button>
        <button onClick={() => navigate('/draw')}>Draw</button>
        <button onClick={() => navigate('/rewrite')}>Rewrite</button>
        <button onClick={() => navigate('/ai')}>AI</button>
        <button onClick={() => navigate('/highlighter')}>Highlighter</button>
=======
        <p>
          Pick a tool. Customize anything. Drag and drop elements to create your
          perfect page.
        </p>
>>>>>>> Stashed changes
      </div>
    </div>
  );
}

export default Home;