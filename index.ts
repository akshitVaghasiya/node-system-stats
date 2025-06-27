import express, { Express, Request, Response, Router } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import routes from './api/routes';

dotenv.config();
const app: Express = express();
const port = process.env.PORT || 3000;
app.use(cors({ origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'], credentials: true }));
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'System Monitor API',
      version: '1.0.0',
      description: 'API for monitoring system resources using node-system-stats',
    },
    servers: [{ url: `http://localhost:${port}` }],
    components: {
      schemas: {
        Error: {
          type: 'object',
          properties: {
            errors: { type: 'array', items: { type: 'string' } },
          },
        },
        SystemSnapshot: {
          type: 'object',
          properties: {
            timestamp: { type: 'number' },
            cpu: {
              type: 'object',
              properties: {
                usage: { type: 'number' },
                loadAverage: {
                  type: 'object',
                  properties: {
                    oneMinute: { type: 'number' },
                    fiveMinute: { type: 'number' },
                    fifteenMinute: { type: 'number' },
                  },
                },
                temperature: {
                  type: 'object',
                  nullable: true,
                  properties: {
                    main: { type: 'number' },
                    cores: { type: 'array', items: { type: 'number' } },
                  },
                },
              },
            },
            memory: {
              type: 'object',
              properties: {
                used: { type: 'number' },
                total: { type: 'number' },
                free: { type: 'number' },
                percentUsed: { type: 'number' },
              },
            },
            disks: {
              type: 'array',
              nullable: true,
              items: {
                type: 'object',
                properties: {
                  filesystem: { type: 'string' },
                  size: { type: 'number' },
                  used: { type: 'number' },
                  available: { type: 'number' },
                  percentUsed: { type: 'number' },
                  mountpoint: { type: 'string', nullable: true },
                },
              },
            },
            battery: {
              type: 'object',
              nullable: true,
              properties: {
                hasBattery: { type: 'boolean' },
                percent: { type: 'number' },
                isCharging: { type: 'boolean' },
                timeRemaining: { type: 'number', nullable: true },
              },
            },
            processes: {
              type: 'array',
              nullable: true,
              items: {
                type: 'object',
                properties: {
                  pid: { type: 'number' },
                  name: { type: 'string' },
                  cpu: { type: 'number' },
                  memory: { type: 'number' },
                  memoryPercent: { type: 'number' },
                },
              },
            },
          },
        },
        CpuStats: {
          type: 'object',
          properties: {
            min: { type: 'number' },
            max: { type: 'number' },
            avg: { type: 'number' },
          },
        },
        MemoryStats: {
          type: 'object',
          properties: {
            percentUsed: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' },
                avg: { type: 'number' },
              },
            },
          },
        },
      },
    },
  },
  apis: ['./api/*.ts'],
};
const swaggerDocs = swaggerJSDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

app.use('/api', routes as Router);

/**
 * @swagger
 * /:
 *   get:
 *     summary: Welcome message
 *     responses:
 *       200:
 *         description: Server welcome message
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 */
app.get('/', (req: Request, res: Response) => {
  res.send('System Monitor Server');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});