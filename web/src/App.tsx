import { InfoOutlined } from "@mui/icons-material";
import { Tooltip } from "@mui/material";
import { Outlet } from "react-router-dom";
import logo from "./assets/logo.png";
import { Button } from "./components";

export const App = () => {
	return (
		<div className="h-dvh flex flex-col justify-between">
			<header className="flex flex-row justify-between px-8 items-center border-b-2">
				<img src={logo} alt="logo" className="my-2" />
				<div className="text-black text-3xl uppercase font-mono">goal home payroll</div>
			</header>

			<Outlet />

			<footer className="h-12 mt-auto flex flex-row justify-end items-center gap-x-4 px-4 border border-t-2">
				<div className="flex flex-grow" />

				<Tooltip title="For any questions or concerns please contact me" arrow placement="top">
					<a href="mailto:mcmullinand@gmail.com" target="_blank" rel="noreferrer">
						<Button variant="outlined">
							mcmullinand@gmail.com
							<InfoOutlined className="text-gray-400 ml-2" />
						</Button>
					</a>
				</Tooltip>

				<p className="text-gray-400 font-mono text-xs">v2.0.0</p>
			</footer>
		</div>
	);
};
