import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBack = () => {
    
    if (window.history.length > 2) {
    navigate(-1); // 真正“返回上一步”
  } else {
    navigate("/"); // 没得退就回首页
  }
  };

  return (
    <div style={{ position: "absolute", top: 16, left: 16, zIndex: 1000 }}>
      <button
        onClick={handleBack}
        style={{
          padding: "6px 12px",
          border: "2px solid #ccc",
          borderRadius: "5px",
          backgroundColor: "white",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        ← Back
      </button>
    </div>
  );
};

export default BackButton;
