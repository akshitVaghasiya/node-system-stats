import { Router, Request, Response } from 'express';
import { getTopProcesses, formatBytes } from 'node-system-stats';
import { ProcessInfo } from '../types';

const router = Router();

/**
 * @swagger
 * /api/processes:
 *   get:
 *     summary: Get top 5 CPU and memory-intensive processes
 *     responses:
 *       200:
 *         description: Process data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cpuProcesses: { type: array, items: { type: object, properties: { pid: { type: number }, name: { type: string }, cpu: { type: number }, memory: { type: number }, memoryPercent: { type: number } } } }
 *                 memoryProcesses: { type: array, items: { type: object, properties: { pid: { type: number }, name: { type: string }, cpu: { type: number }, memory: { type: number }, memoryPercent: { type: number } } } }
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */
async function monitorProcesses(): Promise<any> {
    try {
        const cpuProcesses: ProcessInfo[] = await getTopProcesses(5, 'cpu'); // cpu
        const memoryProcesses: ProcessInfo[] = await getTopProcesses(5, 'memory'); // memory

        return { cpuProcesses, memoryProcesses };
    } catch (err: any) {
        throw err;
    }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {

    monitorProcesses()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ error: `Failed to fetch process data: ${err.message}` }));
});

export default router;