const receiptService = require('../services/receiptService');
const logger = require('../utils/logger');

class ReceiptController {
  /**
   * Get all receipts
   * GET /api/v1/receipts
   */
  async getAllReceipts(req, res, next) {
    try {
      const { page, limit, network, employeeId, startDate, endDate, transactionHash } = req.query;
      
      const result = await receiptService.getAllReceipts({
        page,
        limit,
        network,
        employeeId,
        startDate,
        endDate,
        transactionHash,
      });

      res.json({
        success: true,
        data: result.receipts,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get receipt by ID
   * GET /api/v1/receipts/:id
   */
  async getReceiptById(req, res, next) {
    try {
      const { id } = req.params;
      
      const receipt = await receiptService.getReceiptById(id);

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      if (error.message === 'Receipt not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Get receipt by invoice ID
   * GET /api/v1/receipts/invoice/:invoiceId
   */
  async getReceiptByInvoiceId(req, res, next) {
    try {
      const { invoiceId } = req.params;
      
      const receipt = await receiptService.getReceiptByInvoiceId(invoiceId);

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Get receipt by transaction hash
   * GET /api/v1/receipts/transaction/:txHash
   */
  async getReceiptByTransactionHash(req, res, next) {
    try {
      const { txHash } = req.params;
      
      const receipt = await receiptService.getReceiptByTransactionHash(txHash);

      res.json({
        success: true,
        data: receipt,
      });
    } catch (error) {
      if (error.message === 'Receipt not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Get receipts by employee
   * GET /api/v1/receipts/employee/:employeeId
   */
  async getReceiptsByEmployee(req, res, next) {
    try {
      const { employeeId } = req.params;
      const { page, limit } = req.query;

      const result = await receiptService.getReceiptsByEmployee(employeeId, {
        page,
        limit,
      });

      res.json({
        success: true,
        data: result.receipts,
        pagination: result.pagination,
      });
    } catch (error) {
      if (error.message === 'Employee not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }

  /**
   * Get receipt statistics
   * GET /api/v1/receipts/stats
   */
  async getReceiptStats(req, res, next) {
    try {
      const { network, startDate, endDate } = req.query;

      const stats = await receiptService.getReceiptStats(network, startDate, endDate);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get receipt data for export/download
   * GET /api/v1/receipts/:id/export
   */
  async exportReceipt(req, res, next) {
    try {
      const { id } = req.params;

      const receiptData = await receiptService.generateReceiptData(id);

      res.json({
        success: true,
        data: receiptData,
      });
    } catch (error) {
      if (error.message === 'Receipt not found') {
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }
      next(error);
    }
  }
}

module.exports = new ReceiptController();

