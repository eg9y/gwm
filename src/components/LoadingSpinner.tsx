import React from "react";

export function LoadingSpinner() {
  return (
    <div className="loading-spinner">
      <div className="spinner-bar" />
    </div>
  );
}

// Add styles directly in the component to keep everything together
// You could also create a separate CSS file if preferred
const styles = `
.loading-spinner {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 9999;
  display: flex;
  justify-content: center;
}

.spinner-bar {
  height: 3px;
  background: linear-gradient(90deg, #4F46E5, #8B5CF6);
  animation: loading-bar 1.5s infinite;
  width: 100%;
  position: absolute;
}

@keyframes loading-bar {
  0% {
    width: 0%;
    left: 0;
  }
  50% {
    width: 30%;
    left: 35%;
  }
  100% {
    width: 0%;
    left: 100%;
  }
}
`;

// Add the styles to the document
if (typeof document !== "undefined") {
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}
