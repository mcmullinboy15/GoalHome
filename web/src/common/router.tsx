import { createBrowserRouter } from "react-router-dom";
import { App } from "../App";
import { ErrorPage } from "../pages/ErrorPage";
import { Home } from "../pages/Home";
import { Results } from "../pages/Results";

export const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		errorElement: <ErrorPage />,
		children: [
			{ path: "/", element: <Home /> },
			{ path: "/results", element: <Results /> },
		],
	},
]);
