import { Router, Request, Response } from 'express';
import { usagePercent, totalCores, cpuModel, avgClockMHz, clockMHz } from 'node-system-stats';
import { UsagePercentResult } from '../types';

const router = Router();

/**
 * @swagger
 * /api/cpu:
 *   get:
 *     summary: Get CPU usage and details
 *     responses:
 *       200:
 *         description: CPU usage data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 usage: { type: object, properties: { percent: { type: number }, seconds: { type: number } } }
 *                 core0Usage: { type: object, properties: { percent: { type: number }, seconds: { type: number } } }
 *                 totalCores: { type: number }
 *                 cpuModel: { type: string }
 *                 avgClockSpeed: { type: number }
 *                 allCoreSpeeds: { type: array, items: { type: number } }
 *                 core1Speed: { type: number }
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */
async function checkCpu(): Promise<any> {
    try {
        const result = await usagePercent();
        const core0Usage = await usagePercent({ coreIndex: 0, sampleMs: 2000 });
        const allSpeeds: number[] = clockMHz() as number[];
        const core1Speed: number = clockMHz(1) as number;

        const data = {
            usage: result,
            core0Usage,
            totalCores,
            cpuModel,
            avgClockSpeed: avgClockMHz(),
            allCoreSpeeds: allSpeeds,
            core1Speed,
        };

        return data;
    } catch (err: any) {
        console.error('CPU Error:', err.message);
        throw err;
    }
}

router.get('/', async (req: Request, res: Response) => {
    try {
        const data = await checkCpu();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: `Failed to fetch CPU data: ${err.message}` });
    }
});

export default router;