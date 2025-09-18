import { SetupBluetoothServices, DestroyBluetoothServices } from "./bluetooth";
import { DestroyPlatformServices, SetupPlatformServices } from "./platform";
import {
  DestroyWindowControlServices,
  SetupWindowControlServices,
} from "./window";

/**
 * Services Entry Point
 * @description This file serves as the main entry point for
 * initializing and managing backend services in the
 * Electron application.
 */
export const SetupServices = (): void => {
  SetupPlatformServices();
  SetupWindowControlServices();
  SetupBluetoothServices();
};

/**
 * DestroyServices
 * @description Cleans up and destroys all services before application exit.
 * @return void
 */
export const DestroyServices = (): void => {
  DestroyPlatformServices();
  DestroyWindowControlServices();
  DestroyBluetoothServices();
};
