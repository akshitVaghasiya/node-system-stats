import { Router, Request, Response } from 'express';
import { SystemMonitor, formatBytes } from 'node-system-stats';
import { SystemSnapshot, CpuStats, MemoryStats, DiskInfo, ProcessInfo } from '../types';

// Shared state
let systemSnapshots: SystemSnapshot[] = []; // Changed to single array of snapshots
let systemMonitor: SystemMonitor | null = null;

const router = Router();
/**
 * @swagger
 * /api/system:
 *   get:
 *     summary: Get system snapshots over 10 seconds
 *     responses:
 *       200:
 *         description: System snapshot data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 snapshots: { type: array, items: { $ref: '#/components/schemas/SystemSnapshot' } }
 *                 stats: { type: 'object', nullable: true, properties: { cpu: { $ref: '#/components/schemas/CpuStats' }, memory: { $ref: '#/components/schemas/MemoryStats' } } }
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { type: 'object', properties: { errors: { type: 'array', items: { type: 'string' } } } }
 *       500:
 *         description: Server error
 */
export function startSystemMonitor(): void {
    try {
        if (systemMonitor) {
            return;
        }
        systemMonitor = new SystemMonitor({ interval: 2000, maxHistory: 5 });

        systemMonitor.on('error', (err: Error) => {
        });

        systemMonitor.start();
    } catch (err: any) {
        systemMonitor = null;
    }
}

function waitForSnapshot(timeoutMs: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
        if (systemSnapshots.length >= 5) {
            return resolve();
        }
        if (!systemMonitor) {
            startSystemMonitor();
            if (!systemMonitor) {
                return reject(new Error('Failed to initialize SystemMonitor'));
            }
        }
        const timeout = setTimeout(() => {
            reject(new Error('Timeout waiting for system data'));
        }, timeoutMs);

        const dataHandler = (snapshot: SystemSnapshot) => {
            try {
                // Format snapshot for response
                const formattedSnapshot: any = {
                    ...snapshot,
                    memory: snapshot.memory ? {
                        ...snapshot.memory,
                        total: formatBytes(snapshot.memory.total),
                        free: formatBytes(snapshot.memory.free),
                        used: formatBytes(snapshot.memory.used),
                    } : undefined,
                    disks: snapshot.disks?.map(disk => ({
                        ...disk,
                        size: formatBytes(disk.size),
                        used: formatBytes(disk.used),
                        available: formatBytes(disk.available),
                    })),
                    processes: snapshot.processes?.map(proc => ({
                        ...proc,
                        memory: formatBytes(proc.memory),
                    })),
                };
                systemSnapshots.push(formattedSnapshot); // Changed to push snapshot directly
                if (systemSnapshots.length > 5) systemSnapshots.shift();

                if (systemSnapshots.length >= 5) {
                    clearTimeout(timeout);
                    systemMonitor?.removeListener('data', dataHandler);
                    systemMonitor?.stop();
                    systemMonitor = null;
                    resolve();
                }
            } catch (err: any) {
            }
        };

        systemMonitor!.on('data', dataHandler);
    });
}

router.get('/', async (req: Request, res: Response) => {
    try {
        await waitForSnapshot();
        const response = { snapshots: systemSnapshots };
        systemSnapshots = [];
        res.json(response);
    } catch (err: any) {
        res.status(200).json({ snapshots: systemSnapshots });
        systemSnapshots = [];
        if (systemMonitor) {
            systemMonitor.stop();
            systemMonitor = null;
        }
    }
});

export default router;