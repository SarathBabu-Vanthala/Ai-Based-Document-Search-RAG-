import { useState, useEffect } from "react";
import App from "./App";
import WelcomeScreen from "./WelcomeScreen";

export default function Root(){

  // check if user already configured before
  const [config,setConfig] = useState(()=>{
    const saved = localStorage.getItem("knowledge_config");
    return saved ? JSON.parse(saved) : null;
  });

  console.log("CONFIG:", config);


  const handleGetStarted = (data) => {
    // save config
    localStorage.setItem("knowledge_config", JSON.stringify(data));

    // switch UI
    setConfig(data);
  };

  // ⭐ THIS decides which UI shows
  if(!config){
    return <WelcomeScreen onGetStarted={handleGetStarted} />;
  }

  return (
  <App
    userConfig={config}
    goHome={()=>{
      localStorage.removeItem("knowledge_config");
      setConfig(null);
    }}
  />
);

}
