import { ReceiptsService } from './receipts.service';
import { Pool, QueryResult } from 'pg';
import { getPostgresPool } from '../database/postgres';
import { CreateReceiptDto, UpdateReceiptDto } from '../interfaces/receipt.interface';

jest.mock('../database/postgres');
jest.mock('../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  warn: jest.fn(),
}));

describe('ReceiptsService', () => {
  let receiptsService: ReceiptsService;
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

    receiptsService = new ReceiptsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllReceipts', () => {
    it('should fetch all receipts with correct query', async () => {
      const mockReceipts = [
        {
          id: 1,
          home_id: 1,
          total: 350.00,
          type: 'service',
          vendor_name: 'ABC HVAC Services',
          paid_date: '2025-01-15',
          description: 'AC maintenance',
          category: 'HVAC',
          receipt_url: null,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin@example.com',
          updated_by: null
        }
      ];

      mockClient.query.mockResolvedValue({
        rows: mockReceipts
      } as QueryResult);

      const receipts = await receiptsService.getAllReceipts();

      expect(mockClient.query).toHaveBeenCalled();
      expect(receipts).toEqual(mockReceipts);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should handle errors when fetching receipts', async () => {
      mockClient.query.mockRejectedValue(new Error('Database connection error'));

      await expect(receiptsService.getAllReceipts()).rejects.toThrow('Unable to fetch receipts');
      // Note: BaseRepository uses try/finally, so release() IS called even on error
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getReceiptById', () => {
    it('should fetch a receipt by ID', async () => {
      const mockReceipt = {
        id: 1,
        home_id: 1,
        total: 350.00,
        type: 'service',
        vendor_name: 'ABC HVAC Services',
        paid_date: '2025-01-15',
        description: 'AC maintenance',
        category: 'HVAC',
        receipt_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin@example.com',
        updated_by: null
      };

      mockClient.query.mockResolvedValue({
        rows: [mockReceipt]
      } as QueryResult);

      const receipt = await receiptsService.getReceiptById(1);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE id = $1'),
        [1]
      );
      expect(receipt).toEqual(mockReceipt);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null if receipt not found', async () => {
      mockClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      } as QueryResult);

      const receipt = await receiptsService.getReceiptById(999);

      expect(receipt).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getReceiptsByHomeId', () => {
    it('should fetch receipts by home ID', async () => {
      const mockReceipts = [
        {
          id: 1,
          home_id: 1,
          total: 350.00,
          type: 'service',
          vendor_name: 'ABC HVAC Services',
          paid_date: '2025-01-15'
        }
      ];

      mockClient.query.mockResolvedValue({
        rows: mockReceipts
      } as QueryResult);

      const receipts = await receiptsService.getReceiptsByHomeId(1);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE home_id = $1'),
        [1]
      );
      expect(receipts).toEqual(mockReceipts);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getReceiptsByType', () => {
    it('should fetch receipts by type', async () => {
      const mockReceipts = [
        {
          id: 1,
          home_id: 1,
          total: 350.00,
          type: 'service',
          vendor_name: 'ABC HVAC Services',
          paid_date: '2025-01-15'
        }
      ];

      mockClient.query.mockResolvedValue({
        rows: mockReceipts
      } as QueryResult);

      const receipts = await receiptsService.getReceiptsByType('service');

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE type = $1'),
        ['service']
      );
      expect(receipts).toEqual(mockReceipts);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('getTotalExpensesByHomeId', () => {
    it('should calculate total expenses for a home', async () => {
      mockClient.query.mockResolvedValue({
        rows: [{ total_expenses: '1250.75' }]
      } as QueryResult);

      const total = await receiptsService.getTotalExpensesByHomeId(1);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('SUM(total)'),
        [1]
      );
      expect(total).toBe(1250.75);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('createReceipt', () => {
    const validReceiptData: CreateReceiptDto = {
      home_id: 1,
      total: 350.00,
      type: 'service',
      vendor_name: 'ABC HVAC Services',
      paid_date: '2025-01-15',
      description: 'AC maintenance',
      category: 'HVAC',
      created_by: 'admin@example.com'
    };

    it('should create a receipt with valid data', async () => {
      const mockCreatedReceipt = {
        id: 1,
        ...validReceiptData,
        receipt_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        updated_by: null
      };

      mockClient.query.mockResolvedValue({
        rows: [mockCreatedReceipt]
      } as QueryResult);

      const receipt = await receiptsService.createReceipt(validReceiptData);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO'),
        expect.any(Array)
      );
      expect(receipt).toEqual(mockCreatedReceipt);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should reject receipt with missing home_id', async () => {
      const invalidData = { ...validReceiptData, home_id: undefined as any };

      await expect(receiptsService.createReceipt(invalidData)).rejects.toThrow('home_id is required');
    });

    it('should reject receipt with negative total', async () => {
      const invalidData = { ...validReceiptData, total: -100 };

      await expect(receiptsService.createReceipt(invalidData)).rejects.toThrow('total must be a positive number');
    });

    it('should reject receipt with invalid type', async () => {
      const invalidData = { ...validReceiptData, type: 'invalid' as any };

      await expect(receiptsService.createReceipt(invalidData)).rejects.toThrow('type must be "service" or "store"');
    });

    it('should reject receipt with missing vendor_name', async () => {
      const invalidData = { ...validReceiptData, vendor_name: '' };

      await expect(receiptsService.createReceipt(invalidData)).rejects.toThrow('vendor_name is required');
    });

    it('should reject receipt with invalid date format', async () => {
      const invalidData = { ...validReceiptData, paid_date: '01/15/2025' };

      await expect(receiptsService.createReceipt(invalidData)).rejects.toThrow('Invalid paid_date format');
    });
  });

  describe('updateReceipt', () => {
    const validUpdateData: UpdateReceiptDto = {
      total: 375.00,
      description: 'Updated description'
    };

    it('should update a receipt with valid data', async () => {
      const mockUpdatedReceipt = {
        id: 1,
        home_id: 1,
        total: 375.00,
        type: 'service',
        vendor_name: 'ABC HVAC Services',
        paid_date: '2025-01-15',
        description: 'Updated description',
        category: 'HVAC',
        receipt_url: null,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin@example.com',
        updated_by: 'user@example.com'
      };

      mockClient.query.mockResolvedValue({
        rows: [mockUpdatedReceipt]
      } as QueryResult);

      const receipt = await receiptsService.updateReceipt(1, validUpdateData);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE'),
        expect.any(Array)
      );
      expect(receipt).toEqual(mockUpdatedReceipt);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return null if receipt not found', async () => {
      mockClient.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
        command: '',
        oid: 0,
        fields: []
      } as QueryResult);

      const receipt = await receiptsService.updateReceipt(999, validUpdateData);

      expect(receipt).toBeNull();
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should reject update with invalid type', async () => {
      const invalidData = { type: 'invalid' as any };

      await expect(receiptsService.updateReceipt(1, invalidData)).rejects.toThrow('Invalid type');
    });

    it('should reject update with negative total', async () => {
      const invalidData = { total: -100 };

      await expect(receiptsService.updateReceipt(1, invalidData)).rejects.toThrow('Total must be a positive number');
    });
  });

  describe('deleteReceipt', () => {
    it('should delete a receipt successfully', async () => {
      mockClient.query.mockResolvedValue({
        rowCount: 1
      } as QueryResult);

      const result = await receiptsService.deleteReceipt(1);

      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM'),
        [1]
      );
      expect(result).toBe(true);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should return false if receipt not found', async () => {
      mockClient.query.mockResolvedValue({
        rowCount: 0
      } as QueryResult);

      const result = await receiptsService.deleteReceipt(999);

      expect(result).toBe(false);
      expect(mockClient.release).toHaveBeenCalled();
    });
  });
});
