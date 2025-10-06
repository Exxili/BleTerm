export interface ICharacteristic {
  id: string;
  uuid: string;
  canWrite?: boolean;
  canNotify?: boolean;
  canRead?: boolean;
}
