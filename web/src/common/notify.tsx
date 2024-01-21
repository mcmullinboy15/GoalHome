import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.min.css";

export { toast as notify };

export const NotificationProvider = () => {
  return (
    <ToastContainer
      hideProgressBar={true}
      icon={true}
      position="bottom-center"
      theme="dark"
      autoClose={2000}
    />
  );
};
