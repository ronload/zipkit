export interface City {
  name: string;
  en: string;
  districts: District[];
}

export interface District {
  name: string;
  en: string;
  zip3: string;
}

export interface Road {
  name: string;
  en: string;
}

export interface ZipRange {
  road: string;
  zip6: string;
  even: number;
  lane: number;
  lane1: number;
  alley: number;
  alley1: number;
  numStart: number;
  numStart1: number;
  numEnd: number;
  numEnd1: number;
  floorStart: number;
  floorEnd: number;
}

export interface AddressDetail {
  lane: string;
  alley: string;
  number: string;
  floor: string;
  room: string;
}

export interface AddressState {
  city: City | null;
  district: District | null;
  road: Road | null;
  detail: AddressDetail;
}
