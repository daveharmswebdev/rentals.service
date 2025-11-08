export interface Address {
  id: number;
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country: string;
}

export interface CreateAddressDto {
  street_address: string;
  city: string;
  state: string;
  zip_code: string;
  country?: string;
}

export interface UpdateAddressDto {
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;
}