
import { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [apiStatus, setApiStatus] = useState("Checking...");

  useEffect(() => {
    axios
      .get("http://127.0.0.1:8000/api/v1/health")
      .then((response) => {
        setApiStatus(response.data.status);
      })
      .catch(() => {
        setApiStatus("Disconnected");
      });
  }, []);

  return (
    <div className="container py-5">
      <h1>VoltRoute</h1>
      <p>Smart EV Fleet Management System</p>

      <div className="card p-4 shadow-sm">
        <h5>Backend Connection</h5>

        <p>
          API Status:{" "}
          <strong>{apiStatus}</strong>
        </p>
      </div>
    </div>
  );
}

export default App;
