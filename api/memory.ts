import { Router, Request, Response } from 'express';
import { showMemoryUsage, showTotalMemory, showFreeMemory } from 'node-system-stats';
import { MemoryUsage } from '../types';

const router = Router();

/**
 * @swagger
 * /api/memory:
 *   get:
 *     summary: Get memory usage details
 *     responses:
 *       200:
 *         description: Memory usage data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usage: { type: object, properties: { rss: { type: number }, heapTotal: { type: number }, heapUsed: { type: number }, external: { type: number }, arrayBuffers: { type: number } } }
 *                 totalMb: { type: number }
 *                 totalGb: { type: number }
 *                 freeMb: { type: number }
 *                 freeGb: { type: number }
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */
function checkMemory(): any {
    const memUsage: MemoryUsage = showMemoryUsage();
    const data = {
        usage: memUsage,
        totalMb: showTotalMemory(),
        totalGb: showTotalMemory(true),
        freeMb: showFreeMemory(),
        freeGb: showFreeMemory(true),
    };
    console.log('Memory usage:', memUsage);
    console.log(`Total memory: ${data.totalMb} MB`);
    console.log(`Total memory: ${data.totalGb} GB`);
    console.log(`Free memory: ${data.freeMb} MB`);
    console.log(`Free memory: ${data.freeGb} GB`);
    return data;
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
    if (Object.keys(req.query).length > 0) {
        console.error('Unexpected query parameters:', Object.keys(req.query));
        res.status(400).json({ errors: [`Unexpected query parameters: ${Object.keys(req.query).join(', ')}`] });
        return;
    }
    try {
        const data = checkMemory();
        res.json(data);
    } catch (err: any) {
        console.error('Memory Error:', err.message);
        res.status(500).json({ error: `Failed to fetch memory data: ${err.message}` });
    }
});

export default router;