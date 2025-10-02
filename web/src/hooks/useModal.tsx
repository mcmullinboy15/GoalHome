import { FC, ReactNode, useCallback, useState } from "react";

import { Button } from "../components";

// Type for the data structure of the modal, defining its contents and actions.
export type ModalData = {
	Icon?: ReactNode;
	disabled?: boolean;
	Title: ReactNode;
	children: ReactNode;
	submitLabel: ReactNode;
	onSubmit: () => Promise<void>;
	onCancel?: () => Promise<void>;
	includeCancelBtn?: boolean;
};

// Type for modal control methods, providing open and close functionalities.
export type ModalController = {
	isOpen: boolean;
	open: () => void;
	close: () => void;
};

// Props interface for the Modal component, extending ModalData for content and including control.
interface ModalProps extends ModalData {
	controller: ModalController;
}

// Default Modal Component
export const Modal: FC<ModalProps> = ({
	controller,
	disabled,
	Icon,
	Title,
	children,
	submitLabel,
	onSubmit,
	onCancel,
	includeCancelBtn = true,
}) => {
	// If the modal is not open, return null
	if (!controller.isOpen) return null;

	// Return the modal component
	return (
		<div
			className="relative z-10"
			aria-labelledby="modal-title"
			role="dialog"
			aria-modal="true"
		>
			{/* Overlay */}
			<div className="fixed inset-0 bg-gray-500 bg-opacity-75"></div>

			{/* Modal container */}
			<div className="fixed inset-0 z-10 w-screen overflow-y-auto">
				<div className="flex min-h-full items-center justify-center p-4 text-center sm:items-center sm:p-0">
					{/* Modal content */}
					<div className="relative transform overflow-hidden rounded-lg bg-white shadow-xl transition-all min-w-[240px] sm:my-8">
						<div className="bg-white px-4 pt-5 sm:p-6 sm:pb-0">
							{/* Title and content */}
							<div className="mt-3 text-center sm:mt-0 sm:text-left">
								<h3
									className="text-lg font-semibold text-gray-900 flex flex-col sm:flex-row justify-between items-center"
									id="modal-title"
								>
									{/* Icon */}
									{Icon && (
										<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
											{Icon}
										</div>
									)}
									{Title}
								</h3>
								{/* Passthrough Content */}
								<div className="mt-2">
									<div className="text-sm text-gray-500">{children}</div>
								</div>
							</div>
						</div>
						{/* Action buttons */}
						<div className="bg-gray-50 px-4 py-3 flex flex-col gap-2 sm:flex-row-reverse sm:px-6">
							{/* Take Action Button */}
							<Button
								className="w-full"
								disabled={disabled}
								onClick={async () => {
									await onSubmit();
									controller.close();
								}}
							>
								{submitLabel}
							</Button>
							{/* Cancel Action Button */}
							{includeCancelBtn && (
								<Button
									className="w-full"
									variant="contained"
									onClick={async () => {
										await onCancel?.();
										controller.close();
									}}
								>
									Cancel
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};

// Custom hook for managing modals in a React application.
// This hook provides functionalities to open and close modals
export const useModal = (): ModalController => {
	const [isOpen, setIsOpen] = useState(false);

	// Function to open the modal.
	const open = useCallback(() => setIsOpen(true), []);

	// Function to close the modal.
	const close = useCallback(() => setIsOpen(false), []);

	// Modal controller with open and close functionalities.
	const modalController: ModalController = { isOpen, open, close };

	return modalController;
};
