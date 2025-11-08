const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validation');
const { employeeSchemas } = require('../validators/schemas');

// All routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /api/v1/employees:
 *   get:
 *     summary: Get all employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED]
 *       - in: query
 *         name: department
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of employees
 */
router.get(
  '/',
  validateRequest(employeeSchemas.list),
  employeeController.getAllEmployees.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/active:
 *   get:
 *     summary: Get all active employees
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active employees
 */
router.get(
  '/active',
  employeeController.getActiveEmployees.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/department/{dept}:
 *   get:
 *     summary: Get employees by department
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: dept
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of employees in department
 */
router.get(
  '/department/:dept',
  employeeController.getEmployeesByDepartment.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/stats:
 *   get:
 *     summary: Get employee statistics
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Employee statistics
 */
router.get(
  '/stats',
  employeeController.getEmployeeStats.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   get:
 *     summary: Get employee by ID
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee details
 *       404:
 *         description: Employee not found
 */
router.get(
  '/:id',
  employeeController.getEmployeeById.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}/payments:
 *   get:
 *     summary: Get employee payment history
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment history
 */
router.get(
  '/:id/payments',
  employeeController.getEmployeePaymentHistory.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees:
 *   post:
 *     summary: Create new employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - walletAddress
 *               - department
 *               - salaryAmount
 *               - salaryToken
 *               - paymentFrequency
 *               - network
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               walletAddress:
 *                 type: string
 *               department:
 *                 type: string
 *               role:
 *                 type: string
 *               salaryAmount:
 *                 type: string
 *               salaryToken:
 *                 type: string
 *               paymentFrequency:
 *                 type: string
 *                 enum: [WEEKLY, BIWEEKLY, MONTHLY, QUARTERLY, YEARLY]
 *               network:
 *                 type: string
 *                 enum: [ETHEREUM, POLYGON, BSC]
 *     responses:
 *       201:
 *         description: Employee created
 *       400:
 *         description: Validation error
 *       409:
 *         description: Employee already exists
 */
router.post(
  '/',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  validateRequest(employeeSchemas.create),
  employeeController.createEmployee.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   put:
 *     summary: Update employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               walletAddress:
 *                 type: string
 *               department:
 *                 type: string
 *               role:
 *                 type: string
 *               salaryAmount:
 *                 type: string
 *               salaryToken:
 *                 type: string
 *               paymentFrequency:
 *                 type: string
 *               network:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Employee updated
 *       404:
 *         description: Employee not found
 */
router.put(
  '/:id',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  validateRequest(employeeSchemas.update),
  employeeController.updateEmployee.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}/status:
 *   patch:
 *     summary: Update employee status
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [ACTIVE, INACTIVE, SUSPENDED]
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Employee not found
 */
router.patch(
  '/:id/status',
  authorize(['ADMIN', 'FINANCE_MANAGER']),
  validateRequest(employeeSchemas.updateStatus),
  employeeController.updateEmployeeStatus.bind(employeeController)
);

/**
 * @swagger
 * /api/v1/employees/{id}:
 *   delete:
 *     summary: Delete employee
 *     tags: [Employees]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Employee deleted
 *       400:
 *         description: Cannot delete employee with payments/invoices
 *       404:
 *         description: Employee not found
 */
router.delete(
  '/:id',
  authorize(['ADMIN']),
  employeeController.deleteEmployee.bind(employeeController)
);

module.exports = router;
