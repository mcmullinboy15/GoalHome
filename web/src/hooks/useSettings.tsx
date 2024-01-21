import { Button, Input } from "../components";
import { Modal, ModalController, useModal } from "./useModal";
import { Settings as SettingsType } from "../utils/types";
import { Settings } from "@mui/icons-material";

type Props = {
  modal: ModalController;
  settings: SettingsType;
  updateSetting: (key: string, value: string) => void;
  reset: () => Promise<void>;
  submit: () => Promise<void>;
};

export const SettingsModal = ({
  modal,
  settings,
  updateSetting,
  reset,
  submit,
}: Props) => (
  <Modal
    Title={
      <p className="text-3xl font-bold font-mono text-gray-500">Settings</p>
    }
    includeCancelBtn
    submitLabel="Save"
    onSubmit={submit}
    onCancel={reset}
    controller={modal}
  >
    <div className="w-80 flex flex-col justify-start items-start gap-2 py-4">
      {/* Pay Rate Sheet Name */}
      <label htmlFor="pay-rate-sheet-name">Pay Rate Sheet Name</label>
      <Input
        id="pay-rate-sheet-name"
        placeholder="Pay Rate Sheet Name"
        className="w-full"
        variant="outlined"
        value={settings.payRatesSheetName}
        onChange={(e) => updateSetting("payRatesSheetName", e.target.value)}
      />

      {/* Timesheet Sheet Name */}
      <label htmlFor="timesheet-sheet-name">Timesheet Sheet Name</label>
      <Input
        id="timesheet-sheet-name"
        placeholder="Timesheet Sheet Name"
        className="w-full"
        variant="outlined"
        value={settings.timesheetSheetName}
        onChange={(e) => updateSetting("timesheetSheetName", e.target.value)}
      />

      {/* Payroll Suffix */}
      <label htmlFor="payroll-suffix">Payroll Suffix</label>
      <Input
        id="payroll-suffix"
        placeholder="Payroll Suffix"
        className="w-full"
        variant="outlined"
        value={settings.payrollSuffix}
        onChange={(e) => updateSetting("payrollSuffix", e.target.value)}
      />

      {/* Payroll Hours Sheet Name */}
      <label htmlFor="payroll-hours-sheet-name">Payroll Hours Sheet Name</label>
      <Input
        id="payroll-hours-sheet-name"
        placeholder="Payroll Hours Sheet Name"
        className="w-full"
        variant="outlined"
        value={settings.payrollHoursSheetName}
        onChange={(e) => updateSetting("payrollHoursSheetName", e.target.value)}
      />

      {/* Payroll Pay Sheet Name */}
      <label htmlFor="payroll-pay-sheet-name">Payroll Pay Sheet Name</label>
      <Input
        id="payroll-pay-sheet-name"
        placeholder="Payroll Pay Sheet Name"
        className="w-full"
        variant="outlined"
        value={settings.payrollPaySheetName}
        onChange={(e) => updateSetting("payrollPaySheetName", e.target.value)}
      />
    </div>
  </Modal>
);

export const SettingsButton = ({ modal }: Props) => (
  <Button variant="contained" onClick={modal.open}>
    <Settings className="w-4 h-4 text-white" />
  </Button>
);

export const useSettings = () => {
  // const modal = useModal();

  // const [settings, setSettings] = useState<SettingsType>({} as SettingsType);

  // const updateSetting = async (key: string, value: string) => {
  //   setSettings((s) => ({ ...s, [key]: value }));
  // };

  // const reset = async () => {
  //   getSettings().then((s) => {
  //     console.log({ reset_settings: s });
  //     setSettings(JSON.parse(JSON.stringify(s)))
  //   });
  // };

  // const submit = async () => {
  //   await updateSettings(settings);
  //   await reset();
  // };

  // useEffect(() => {
  //   reset();
  // }, []);

  const settings = {
    payRatesSheetName: "Pay Rate",
    payrollHoursSheetName: "Payroll - Hours",
    payrollPaySheetName: "Payroll - Pay",
    payrollSuffix: " - Payroll",
    timesheetSheetName: "Entries",
  } as SettingsType;

  return { settings /* modal, updateSetting, reset, submit */ }; // The problem has to be here
};
