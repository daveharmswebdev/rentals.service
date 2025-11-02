import { HomesService } from './homes.service';
import { Pool, QueryResult } from 'pg';
import { getPostgresPool } from '../database/postgres';

jest.mock('../database/postgres');

describe('HomesService', () => {
  let homesService: HomesService;
  let mockPool: jest.Mocked<Pool>;
  let mockClient: {
    query: jest.Mock;
    release: jest.Mock;
  };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      release: jest.fn()
    };

    mockPool = {
      connect: jest.fn().mockResolvedValue(mockClient)
    } as any;

    (getPostgresPool as jest.Mock).mockReturnValue(mockPool);

    homesService = new HomesService();
  });

  it('should fetch all homes with correct query', async () => {
    const mockHomes = [
      {
        id: 1,
        streetAddress: '123 Main St',
        city: 'Anytown',
        state: 'CA',
        zipCode: '12345',
        squareFeet: 2500,
        bedrooms: 4,
        fullBath: 2,
        halfBath: 1,
        garageSpaces: 2
      }
    ];

    mockClient.query.mockResolvedValue({
      rows: mockHomes
    } as QueryResult);

    const homes = await homesService.getAllHomes();

    expect(mockClient.query).toHaveBeenCalledWith(expect.stringMatching(/FROM\s+homes\s+h\s+JOIN\s+addresses\s+a\s+ON\s+h\.address_id\s*=\s*a\.id/i));
    expect(homes).toEqual(mockHomes);
    expect(mockClient.release).toHaveBeenCalled();
  });

  it('should handle errors when fetching homes', async () => {
    mockClient.query.mockRejectedValue(new Error('Database connection error'));

    await expect(homesService.getAllHomes()).rejects.toThrow('Unable to fetch homes');
    expect(mockClient.release).not.toHaveBeenCalled();
  });
});
