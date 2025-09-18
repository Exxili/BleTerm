import { SetupBluetoothService, DestroyBluetoothService } from "./bluetooth";

/**
 * Services Entry Point
 * @description This file serves as the main entry point for
 * initializing and managing backend services in the
 * Electron application.
 */
export const SetupServices = (): void => {
  SetupBluetoothService();
};

/**
 * DestroyServices
 * @description Cleans up and destroys all services before application exit.
 * @return void
 */
export const DestroyServices = (): void => {
  DestroyBluetoothService();
};
