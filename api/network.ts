import { Router, Request, Response } from 'express';
import { getNetworkInterfaces, NetworkMonitor, formatBytes } from 'node-system-stats';
import { NetworkInterface, NetworkTraffic } from '../types';

const router = Router();

/**
 * @swagger
 * /api/network:
 *   get:
 *     summary: Get network interfaces and traffic over 10 seconds
 *     responses:
 *       200:
 *         description: Network data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interfaces: { type: array, items: { type: object, properties: { name: { type: 'string' }, ip: { type: 'string' }, mac: { type: 'string', nullable: true }, type: { type: 'string' }, netmask: { type: 'string' }, internal: { type: 'boolean', nullable: true }, operstate: { type: 'string' }, mtu: { type: 'number' }, speed: { type: 'number' } } } }
 *                 traffic: { type: array, items: { type: array, items: { type: object, properties: { interface: { type: 'string' }, bytesReceivedPerSec: { type: 'string' }, bytesSentPerSec: { type: 'string' } } } } }
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */
async function monitorNetwork(): Promise<{ interfaces: NetworkInterface[]; traffic: Record<string, NetworkTraffic[]> }> {
    try {
        const interfaces: any[] = await getNetworkInterfaces();
        const trafficSnapshots: NetworkTraffic[][] = [];
        const networkMonitor = new NetworkMonitor(1000);

        return new Promise((resolve, reject) => {
            networkMonitor.on('data', (trafficData: NetworkTraffic[]) => {
                const formattedTraffic: any = trafficData.map(iface => ({
                    interface: iface.interface,
                    bytesReceivedPerSec: formatBytes(iface.bytesReceivedPerSec),
                    bytesSentPerSec: formatBytes(iface.bytesSentPerSec),
                }));

                trafficSnapshots.push(formattedTraffic);
                const snapshotIndex = trafficSnapshots.length;

                console.log(`Snapshot ${snapshotIndex} at ${new Date().toLocaleTimeString()}:`);
                formattedTraffic.forEach(iface => {
                    console.log(`Interface: ${iface.interface}`);
                    console.log(`  Download: ${iface.bytesReceivedPerSec}/s`);
                    console.log(`  Upload: ${iface.bytesSentPerSec}/s`);
                });

                if (snapshotIndex >= 10) {
                    networkMonitor.stop();
                    const trafficObject: Record<string, NetworkTraffic[]> = {};
                    trafficSnapshots.forEach((snap, index) => {
                        trafficObject[String(index + 1)] = snap;
                    });

                    resolve({ interfaces, traffic: trafficObject });
                }
            });

            networkMonitor.on('error', (err: Error) => {
                console.error('Network Monitor error:', err.message);
                networkMonitor.stop();
                reject(err);
            });

            networkMonitor.start();

            setTimeout(() => {
                networkMonitor.stop();
                if (trafficSnapshots.length === 0) {
                    reject(new Error('No network traffic data collected'));
                } else {
                    const trafficObject: Record<string, NetworkTraffic[]> = {};
                    trafficSnapshots.forEach((snap, index) => {
                        trafficObject[String(index + 1)] = snap;
                    });

                    resolve({ interfaces, traffic: trafficObject });
                }
            }, 10000);
        });
    } catch (err: any) {
        console.error('Network Error:', err.message);
        throw err;
    }
}

router.get('/', async (req: Request, res: Response) => {
    try {
        const data = await monitorNetwork();
        res.json(data);
    } catch (err: any) {
        res.status(500).json({ error: `Failed to fetch network data: ${err.message}` });
    }
});

export default router;