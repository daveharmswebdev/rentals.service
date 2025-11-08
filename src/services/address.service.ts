import { AddressRepository } from '../repositories/address.repository';
import { Address, CreateAddressDto, UpdateAddressDto } from '../interfaces/address.interface';
import { getPostgresPool } from '../database/postgres';

export class AddressService {
  private repository: AddressRepository;

  constructor() {
    const pool = getPostgresPool();
    this.repository = new AddressRepository(pool);
  }

  async getAllAddresses(): Promise<Address[]> {
    try {
      return await this.repository.getAll();
    } catch (error) {
      console.error('Error fetching addresses:', error);
      throw new Error('Unable to fetch addresses');
    }
  }

  async getAddressById(id: number): Promise<Address | null> {
    try {
      return await this.repository.getById(id);
    } catch (error) {
      console.error('Error fetching address:', error);
      throw new Error('Unable to fetch address');
    }
  }

  async createAddress(data: CreateAddressDto): Promise<Address> {
    try {
      const addressData = {
        ...data,
        country: data.country || 'USA'
      };
      return await this.repository.create(addressData);
    } catch (error) {
      console.error('Error creating address:', error);
      throw new Error('Unable to create address');
    }
  }

  async updateAddress(id: number, data: UpdateAddressDto): Promise<Address | null> {
    try {
      return await this.repository.update(id, data);
    } catch (error) {
      console.error('Error updating address:', error);
      throw new Error('Unable to update address');
    }
  }

  async deleteAddress(id: number): Promise<boolean> {
    try {
      return await this.repository.delete(id);
    } catch (error) {
      console.error('Error deleting address:', error);
      throw new Error('Unable to delete address');
    }
  }
}