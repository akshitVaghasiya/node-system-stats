import { Router, Request, Response } from 'express';
import { SystemMonitor, formatBytes } from 'node-system-stats';
import { SystemSnapshot, CpuStats, MemoryStats, DiskInfo, ProcessInfo } from '../types';

// Shared state
let systemSnapshots: SystemSnapshot[][] = [];
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
            console.log('SystemMonitor already running');
            return;
        }
        console.log('Starting SystemMonitor...');
        systemMonitor = new SystemMonitor({ interval: 2000, maxHistory: 5 });

        systemMonitor.on('error', (err: Error) => {
            console.error('SystemMonitor error:', err.message);
        });

        systemMonitor.start();
        console.log('SystemMonitor started');
    } catch (err: any) {
        console.error('SystemMonitor init error:', err.message);
        systemMonitor = null;
    }
}

function waitForSnapshot(timeoutMs: number = 10000): Promise<void> {
    return new Promise((resolve, reject) => {
        if (systemSnapshots.length >= 5) {
            console.log('5 snapshots already available');
            return resolve();
        }
        if (!systemMonitor) {
            console.log('SystemMonitor not initialized, starting...');
            startSystemMonitor();
            if (!systemMonitor) {
                return reject(new Error('Failed to initialize SystemMonitor'));
            }
        }
        console.log('Waiting for 5 snapshots...');
        const timeout = setTimeout(() => {
            console.error('Timeout waiting for 5 snapshots, collected:', systemSnapshots.length);
            reject(new Error('Timeout waiting for system data'));
        }, timeoutMs);

        const dataHandler = (snapshot: SystemSnapshot) => {
            try {
                console.log('Snapshot received:', new Date(snapshot.timestamp).toLocaleTimeString());
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
                systemSnapshots.push([formattedSnapshot]);
                if (systemSnapshots.length > 5) systemSnapshots.shift();
                console.clear();
                console.log("snapshot-->", snapshot);

                console.log('=== System Monitor ===');
                console.log(`Time: ${new Date(snapshot.timestamp).toLocaleTimeString()}`);
                console.log(`\nCPU: ${(snapshot.cpu?.usage ?? 0).toFixed(1)}%`);
                console.log(`Load average: ${(snapshot.cpu?.loadAverage?.oneMinute ?? 0).toFixed(2)}`);
                if (snapshot.cpu?.temperature) {
                    console.log(`CPU Temperature: ${snapshot.cpu.temperature.main}°C`);
                }
                console.log(`\nMemory:`);
                console.log(`  Used: ${formatBytes(snapshot.memory?.used ?? 0)} / ${formatBytes(snapshot.memory?.total ?? 0)}`);
                console.log(`  Free: ${formatBytes(snapshot.memory?.free ?? 0)}`);
                console.log(`  Usage: ${(snapshot.memory?.percentUsed ?? 0).toFixed(1)}%`);
                if (snapshot.disks) {
                    console.log(`\nDisk Usage:`);
                    snapshot.disks.forEach((disk: DiskInfo) => {
                        console.log(`  ${disk.filesystem}: ${disk.percentUsed}% used`);
                    });
                }
                if (snapshot.battery && snapshot.battery.hasBattery) {
                    console.log(`\nBattery: ${snapshot.battery.percent}% ${snapshot.battery.isCharging ? '(charging)' : ''}`);
                }
                if (snapshot.processes) {
                    console.log(`\nTop Processes:`);
                    snapshot.processes.slice(0, 3).forEach((proc: ProcessInfo) => {
                        console.log(`  ${proc.name}: CPU ${(proc.cpu ?? 0).toFixed(1)}%, Mem ${formatBytes(proc.memory ?? 0)}`);
                    });
                }
                if (systemSnapshots.length >= 5) {
                    clearTimeout(timeout);
                    console.log('5 snapshots collected, stopping monitor');
                    systemMonitor?.removeListener('data', dataHandler);
                    systemMonitor?.stop();
                    systemMonitor = null;
                    resolve();
                }
            } catch (err: any) {
                console.error('Snapshot processing error:', err.message);
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
        console.error('System error:', err.message);
        res.status(200).json({ snapshots: systemSnapshots, stats: null });
        systemSnapshots = [];
        if (systemMonitor) {
            systemMonitor.stop();
            systemMonitor = null;
        }
    }
});

export default router;