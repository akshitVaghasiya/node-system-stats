import { Router, Request, Response } from 'express';
import { getCpuTemperature, getBatteryInfo } from 'node-system-stats';
import { CpuTemperature, BatteryInfo } from '../types';

const router = Router();

/**
 * @swagger
 * /api/hardware:
 *   get:
 *     summary: Get CPU temperature and battery info
 *     responses:
 *       200:
 *         description: Hardware status data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cpuTemperature: { type: object, properties: { main: { type: number }, cores: { type: array, items: { type: number } } }, nullable: true }
 *                 battery: { type: object, properties: { hasBattery: { type: boolean }, percent: { type: number }, isCharging: { type: boolean }, timeRemaining: { type: number, nullable: true } } }
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */
async function checkHardwareStatus(): Promise<any> {
    try {
        const temp: CpuTemperature | null = await getCpuTemperature();
        const battery: BatteryInfo = await getBatteryInfo();
        const data = { cpuTemperature: temp, battery };
        return data;
    } catch (err: any) {
        throw err;
    }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
    checkHardwareStatus()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ error: `Failed to fetch hardware data: ${err.message}` }));
});

export default router;