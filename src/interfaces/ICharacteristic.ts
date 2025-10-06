export interface Characteristic {
  id: string;
  uuid: string;
  canWrite?: boolean;
  canNotify?: boolean;
  canRead?: boolean;
}
