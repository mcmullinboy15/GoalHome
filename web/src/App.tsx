import { Outlet } from "react-router-dom";
import logo from "./assets/logo.png";
import { Button } from "./components";

export const App = () => {
	return (
		<div className="h-dvh flex flex-col justify-between">
			<header className="flex flex-row justify-between px-8 items-center ">
				<img src={logo} alt="logo" className="my-2" />
				<div className="text-black text-3xl uppercase font-mono">
					goal home payroll
				</div>
			</header>

			<Outlet />

			<footer className="h-12 flex flex-row justify-end items-center gap-x-4 px-4 border border-t-2">
				{/* <SettingsButton {...settingsController} settings={settings} /> */}

				<div className="flex flex-grow" />

				<p className="text-gray-400 font-mono text-xs">
					For any questions or concerns please contact me at
				</p>

				<a href="mailto:mcmullinand@gmail.com" target="_blank" rel="noreferrer">
					<Button variant="outlined">mcmullinand@gmail.com</Button>
				</a>

				<p className="text-gray-400 font-mono text-xs">v2.0.1</p>
			</footer>

			{/* <SettingsModal {...settingsController} settings={settings} /> */}
		</div>
	);
};
