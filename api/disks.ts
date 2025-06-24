import { Router, Request, Response } from 'express';
import { getDiskInfo, formatBytes } from 'node-system-stats';
import { DiskInfo } from '../types';

const router = Router();

/**
 * @swagger
 * /api/disks:
 *   get:
 *     summary: Get disk usage details
 *     parameters:
 *       - in: query
 *         name: path
 *         schema:
 *           type: string
 *         required: false
 *         description: Specific directory path (e.g., C:\\Users or C)
 *     responses:
 *       200:
 *         description: Disk usage data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 allDisks: { type: array, items: { type: object, properties: { filesystem: { type: 'string' }, size: { type: 'string' }, used: { type: 'string' }, available: { type: 'string' }, percentUsed: { type: 'number' }, mountpoint: { type: 'string', nullable: true } } } }
 *                 specificDisk: { type: array, nullable: true, items: { type: object, properties: { filesystem: { type: 'string' }, size: { type: 'string' }, used: { type: 'string' }, available: { type: 'string' }, percentUsed: { type: 'number' }, mountpoint: { type: 'string', nullable: true } } } }
 *       400:
 *         description: Invalid query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */
type FormattedDiskInfo = Omit<DiskInfo, 'size' | 'used' | 'available'> & {
    size: string;
    used: string;
    available: string;
};

async function checkDisks(path?: string): Promise<{ allDisks: FormattedDiskInfo[]; specificDisk?: FormattedDiskInfo[] }> {
    try {
        const allDisks: DiskInfo[] = await getDiskInfo();
        console.log('All Disks:', allDisks);
        allDisks.forEach(disk => {
            console.log(`Disk ${disk.filesystem}:`);
            console.log(`  Total: ${formatBytes(disk.size)}`);
            console.log(`  Used: ${formatBytes(disk.used)} (${disk.percentUsed}%)`);
            console.log(`  Available: ${formatBytes(disk.available)}`);
        });

        // Format allDisks for response
        const formattedAllDisks: FormattedDiskInfo[] = allDisks.map(disk => ({
            ...disk,
            sizeBytes: disk.size,
            size: formatBytes(disk.size),
            usedBytes: disk.used,
            used: formatBytes(disk.used),
            availableBytes: disk.available,
            available: formatBytes(disk.available),
        }));

        let specificDisk: FormattedDiskInfo[] | undefined;
        if (path) {
            // Normalize path: add colon if missing (e.g., C → C:, C\Users → C:\Users)
            let normalizedPath = path;
            if (path.match(/^[a-zA-Z](?:\\|$)/)) {
                normalizedPath = path.replace(/^([a-zA-Z])(\\|$)/, '$1:$2');
            } else if (path.match(/^[a-zA-Z]$/)) {
                normalizedPath = `${path}:`;
            }
            const rawSpecificDisk = await getDiskInfo(normalizedPath);
            console.log(`Specific Disk ${rawSpecificDisk[0]?.filesystem || normalizedPath}:`);
            console.log(`  Total: ${formatBytes(rawSpecificDisk[0]?.size ?? 0)}`);
            console.log(`  Used: ${formatBytes(rawSpecificDisk[0]?.used ?? 0)} (${rawSpecificDisk[0]?.percentUsed ?? 0}%)`);
            console.log(`  Available: ${formatBytes(rawSpecificDisk[0]?.available ?? 0)}`);

            // Format specificDisk for response
            specificDisk = rawSpecificDisk.map(disk => ({
                ...disk,
                sizeBytes: disk.size,
                size: formatBytes(disk.size),
                usedBytes: disk.used,
                used: formatBytes(disk.used),
                availableBytes: disk.available,
                available: formatBytes(disk.available),
            }));
        }

        return { allDisks: formattedAllDisks, specificDisk };
    } catch (err: any) {
        console.error('Disk Error:', err.message);
        throw err;
    }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
    const { path } = req.query;
    try {
        let normalizedPath: string | undefined;
        if (typeof path === 'string') {
            // Normalize path: add colon after drive letter (e.g., D\nirma → D:\nirma, D → D:)
            normalizedPath = path.replace(/^([a-zA-Z])([\\/]|$)/, '$1:$2').replace(/\\/g, '\\');
            if (!normalizedPath.includes(':')) {
                normalizedPath = `${normalizedPath}:`;
            }
        }
        const data = await checkDisks(normalizedPath);
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: `Failed to fetch disk data: ${err.message}` });
    }
});

export default router;