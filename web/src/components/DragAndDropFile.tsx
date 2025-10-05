import {
	type ChangeEvent,
	type DragEvent,
	type FC,
	type ReactNode,
	useCallback,
	useState,
} from "react";

type DragAndDropFileProps = {
	name: string;
	label: ReactNode;
	isLoaded: boolean;
	onInput: (value: FileList) => void;
	accept?: string;
	disabled?: boolean;
	multiple?: boolean;
	dense?: boolean;
};

// Define type for event handlers
type DragHandler = (event: DragEvent<HTMLButtonElement>) => void;
type ChangeHandler = (event: ChangeEvent<HTMLInputElement>) => void;

export const DragAndDropFile: FC<DragAndDropFileProps> = ({
	name,
	label,
	isLoaded,
	onInput,
	disabled = false,
	accept = undefined,
	multiple = false,
	dense = false,
}) => {
	const [dragging, setDragging] = useState(false);

	const handleDragEnter: DragHandler = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(true);
	}, []);

	const handleDragLeave: DragHandler = useCallback((e) => {
		e.preventDefault();
		e.stopPropagation();
		setDragging(false);
	}, []);

	const handleDragOver: DragHandler = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			if (!dragging) {
				setDragging(true);
			}
		},
		[dragging],
	);

	const handleDropInput: DragHandler = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			setDragging(false);
			if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
				onInput(e.dataTransfer.files);
				e.dataTransfer.clearData();
			}
		},
		[onInput],
	);

	const handleFileInput: ChangeHandler = useCallback(
		(e) => {
			e.preventDefault();
			e.stopPropagation();
			setDragging(false);

			const target = e.target as HTMLInputElement & {
				files: FileList;
			};
			if (target.files && target.files.length > 0) {
				onInput(target.files);
			}
		},
		[onInput],
	);

	return (
		<button
			type="button"
			className={[
				`shadow-sm hover:shadow-md border-dashed rounded-md overflow-none border-white-500`,
				dense ? "h-10" : "h-20",
				dragging ? `border-2 bg-gray-400` : "border-2",
				isLoaded ? `border-[1px] bg-gray-200` : "border-2",
				disabled ? "border-[1px] border-white-300" : "border-2",
			].join(" ")}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			onDragOver={handleDragOver}
			onDrop={handleDropInput}
		>
			<label
				htmlFor={name}
				className="cursor-pointer font-medium whitespace-nowrap h-full flex justify-center items-center text-gray-600 mx-2"
			>
				<input
					id={name}
					data-testid={name}
					onInput={handleFileInput}
					type="file"
					className="sr-only"
					name={name}
					multiple={multiple}
					disabled={disabled}
					accept={accept}
					// @ts-expect-error
					webkitdirectory={multiple ? "" : undefined}
				/>
				{label}
			</label>
		</button>
	);
};
