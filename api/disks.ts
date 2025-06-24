import { Router, Request, Response } from 'express';
import { getDiskInfo, formatBytes } from 'node-system-stats';
import { DiskInfo } from '../types';

const router = Router();

/**
 * @swagger
 * /api/disks:
 *   get:
 *     summary: Get disk usage details
 *     responses:
 *       200:
 *         description: Disk usage data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allDisks: { type: array, items: { type: object, properties: { filesystem: { type: string }, size: { type: number }, used: { type: number }, available: { type: number }, percentUsed: { type: number }, mountpoint: { type: string, nullable: true } } } }
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */
async function checkDisks(): Promise<any> {
    try {
        const allDisks: DiskInfo[] = await getDiskInfo();
        const data = { allDisks };
        allDisks.forEach(disk => {
            console.log(`Disk ${disk.filesystem}:`);
            console.log(`  Total: ${formatBytes(disk.size)}`);
            console.log(`  Used: ${formatBytes(disk.used)} (${disk.percentUsed}%)`);
            console.log(`  Available: ${formatBytes(disk.available)}`);
        });
        return data;
    } catch (err: any) {
        console.error('Disk Error:', err.message);
        throw err;
    }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
    if (Object.keys(req.query).length > 0) {
        console.error('Unexpected query parameters:', Object.keys(req.query));
        res.status(400).json({ errors: [`Unexpected query parameters: ${Object.keys(req.query).join(', ')}`] });
        return;
    }
    checkDisks()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ error: `Failed to fetch disk data: ${err.message}` }));
});

export default router;