import { isRouteErrorResponse, useRouteError } from "react-router-dom";

export const ErrorPage = () => {
	const error = useRouteError();
	console.error(error);

	return (
		<div className="flex justify-center items-center h-screen w-full flex-nowrap">
			<div className="text-center">
				<h1 className="text-xl font-bold">Oops!</h1>
				<div className="my-4">Sorry, an unexpected error has occurred.</div>
				<p>
					<i>
						{(isRouteErrorResponse(error) ? error.statusText : error instanceof Error ? error.message : null) ||
							"Unknown Error"}
					</i>
				</p>
			</div>
		</div>
	);
};
