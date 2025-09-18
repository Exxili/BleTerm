import { SetupBluetoothService, DestroyBluetoothService } from "./bluetooth";
import { DestroyPlatformServices, SetupPlatformServices } from "./platform";

/**
 * Services Entry Point
 * @description This file serves as the main entry point for
 * initializing and managing backend services in the
 * Electron application.
 */
export const SetupServices = (): void => {
  SetupPlatformServices();
  SetupBluetoothService();
};

/**
 * DestroyServices
 * @description Cleans up and destroys all services before application exit.
 * @return void
 */
export const DestroyServices = (): void => {
  DestroyPlatformServices();
  DestroyBluetoothService();
};
