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
        console.log("memory-->", memoryProcesses);

        const validMemoryProcesses = memoryProcesses.filter(proc => !isNaN(proc.pid) && proc.name !== proc.memory.toString());
        console.log('Top CPU processes:', cpuProcesses);
        console.log('Top memory processes:', validMemoryProcesses);
        console.log('CPU Usage:');
        cpuProcesses.forEach(proc => {
            console.log(`  ${proc.name} (PID ${proc.pid}): CPU ${proc.cpu.toFixed(1)}%, Memory ${formatBytes(proc.memory)}`);
        });
        console.log('Memory Usage:');
        validMemoryProcesses.forEach(proc => {
            console.log(`  ${proc.name} (PID ${proc.pid}): CPU ${proc.cpu.toFixed(1)}%, Memory ${formatBytes(proc.memory)}`);
        });
        return { cpuProcesses, memoryProcesses };
    } catch (err: any) {
        console.error('Process Error:', err.message);
        throw err;
    }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
    if (Object.keys(req.query).length > 0) {
        console.error('Unexpected query parameters:', Object.keys(req.query));
        res.status(400).json({ errors: [`Unexpected query parameters: ${Object.keys(req.query).join(', ')}`] });
        return
    }
    monitorProcesses()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ error: `Failed to fetch process data: ${err.message}` }));
});

export default router;