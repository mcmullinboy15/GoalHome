import React, { useState } from "react";
import { Switch as HeadlessSwitch } from "@headlessui/react";
import IconButton from "@mui/material/IconButton";

type HTMLButtonProps = React.DetailedHTMLProps<
	React.ButtonHTMLAttributes<HTMLButtonElement>,
	HTMLButtonElement
>;
type ButtonProps = HTMLButtonProps & CustomProps;

type HTMLLabelProps = React.DetailedHTMLProps<
	React.LabelHTMLAttributes<HTMLLabelElement>,
	HTMLLabelElement
>;
type LabelProps = HTMLLabelProps & CustomProps;

type HTMLInputProps = React.DetailedHTMLProps<
	React.InputHTMLAttributes<HTMLInputElement>,
	HTMLInputElement
>;
type InputProps = HTMLInputProps & CustomProps;

type HTMLSelectProps = React.DetailedHTMLProps<
	React.SelectHTMLAttributes<HTMLSelectElement>,
	HTMLSelectElement
>;
type SelectProps = HTMLSelectProps & CustomProps;

type SwitchProps = {
	value: boolean;
	setValue: (value: boolean) => void;
};

type CustomProps = {
	disabled?: boolean;
	className?: string;
	variant?: "text" | "contained" | "outlined";
	color?: "primary" | "secondary";
};

// Helper Functions

export function classNames(...classes: string[]) {
	return classes.filter(Boolean).join(" ");
}

const handleClassName = (props: CustomProps) => {
	let className =
		"text-white cursor-pointer font-bold font-mono py-1 px-2 rounded-lg " +
		(props.className || "");

	if (props.disabled) {
		className += " opacity-50 cursor-not-allowed";
	}

	// Variant: Default variant is text
	if (!props.variant || props.variant === "text") {
		className += " bg-gray-950 hover:bg-opacity-75";
	} else if (props.variant === "contained") {
		className += " bg-gray-500 hover:bg-gray-700";
	} else if (props.variant === "outlined") {
		className += " border border-gray-400 hover:border-current !text-gray-400";
	}

	return className;
};

// Components

export const Button = (props: ButtonProps) => {
	const className = handleClassName(props);

	return (
		// @ts-ignore
		<button
			{...props}
			className={className}
			data-testid={props.id ?? props.name}
		>
			{props.children}
		</button>
	);
};

export const Label = (props: LabelProps) => {
	const className = handleClassName(props);

	return (
		<label {...props} className={className}>
			{props.children}
		</label>
	);
};

export const Input = (props: InputProps) => {
	const className = handleClassName(props);

	return (
		<input
			{...props}
			className={className}
			data-testid={props.id ?? props.name}
		/>
	);
};

export const Select = (props: SelectProps) => {
	const className = handleClassName(props);

	return (
		<select
			{...props}
			className={className}
			data-testid={props.id ?? props.name}
		/>
	);
};

export const Switch = (props: SwitchProps) => {
	const [enabled, setEnabled] = useState(props.value);
	return (
		<HeadlessSwitch
			checked={enabled}
			onChange={() => {
				props.setValue(!enabled);
				setEnabled(!enabled);
			}}
			className={classNames(
				enabled ? "bg-blue-500" : "bg-gray-200",
				"relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
			)}
		>
			<span className="sr-only">Use setting</span>
			<span
				aria-hidden="true"
				className={classNames(
					enabled ? "translate-x-5" : "translate-x-0",
					"pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
				)}
			></span>
		</HeadlessSwitch>
	);
};

export const HoverIconWithLabel = (props: any) => {
	const { icon, label, ...rest } = props;

	return (
		<button
			{...rest}
			className={
				"group flex flex-row items-center w-auto font-bold hover:text-white transition-[width] ease-in-out rounded-lg delay-100 duration-300 hover:bg-blue-500 " +
				rest.className
			}
		>
			<IconButton size="small" className="group-hover:!text-white">
				{icon}
			</IconButton>
			<span className="whitespace-nowrap text-ellipsis overflow-hidden !w-0 group-hover:!w-auto group-hover:pr-2">
				{label}
			</span>
		</button>
	);
};
