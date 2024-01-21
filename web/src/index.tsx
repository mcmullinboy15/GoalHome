import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import reportWebVitals from "./reportWebVitals";
import { NotificationProvider } from "./common/notify";
import { RouterProvider } from "react-router-dom";
import { router } from "./common/router";
import { RunPayrollProvider } from "./context/payroll";
import { FileWorkBookProvider } from "./context/file-workbook";

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
);
root.render(
  <React.StrictMode>
    <FileWorkBookProvider>
      <RunPayrollProvider>
        <RouterProvider router={router} />
      </RunPayrollProvider>
    </FileWorkBookProvider>
    <NotificationProvider />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
