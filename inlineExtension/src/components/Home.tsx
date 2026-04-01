import { useNavigate } from "react-router-dom";
import { DiAptana } from "react-icons/di";
import { IoIosArrowDroprightCircle } from "react-icons/io";
import { FaPencil } from "react-icons/fa6";


import "./Home.css";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="home-screen">
    {/* Top Navigation */}
        <div className="top-bar">
          <div className="logo-container">
            <div className="logo" aria-label="Logo"><FaPencil /></div>
            <h1 className="app-name">Inline</h1>
          </div>
           <div className="nav-buttons">
            <button onClick={() => navigate('/settings')} className="settings-button"><DiAptana /></button>
            <button className='back-button' onClick={() => navigate('/')}><IoIosArrowDroprightCircle /></button>
           </div>
            
        </div>
      
      {/* Main Content */}
    
        <div className="content">
        <h2>Make every page truly yours</h2>

        <p>Pick a tool. Customize anything. Drag and drop elements to create your perfect page.</p>
        </div>
    
       
      
    </div>
  );
}

export default Home;