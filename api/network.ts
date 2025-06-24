import { Router, Request, Response } from 'express';
import { getNetworkInterfaces, NetworkMonitor, formatBytes } from 'node-system-stats';
import { NetworkInterface, NetworkTraffic } from '../types';

const router = Router();

/**
 * @swagger
 * /api/network:
 *   get:
 *     summary: Get network interfaces and traffic
 *     responses:
 *       200:
 *         description: Network data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 interfaces: { type: array, items: { type: object, properties: { name: { type: string }, ip: { type: string }, mac: { type: string, nullable: true }, type: { type: string }, netmask: { type: string }, internal: { type: boolean, nullable: true }, operstate: { type: string }, mtu: { type: number }, speed: { type: number } } } }
 *                 traffic: { type: array, items: { type: object, properties: { interface: { type: string }, bytesReceivedPerSec: { type: number }, bytesSentPerSec: { type: number } } } }
 *       400:
 *         description: Unexpected query parameters
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Error' }
 *       500:
 *         description: Server error
 */
async function monitorNetwork(): Promise<any> {
    try {
        const interfaces: any[] = await getNetworkInterfaces();
        const traffic: NetworkTraffic[] = [];
        const networkMonitor = new NetworkMonitor(1000);
        networkMonitor.on('data', (trafficData: NetworkTraffic[]) => {
            traffic.push(...trafficData);
            trafficData.forEach(iface => {
                console.log(`Interface: ${iface.interface}`);
                console.log(`  Download: ${formatBytes(iface.bytesReceivedPerSec)}/s`);
                console.log(`  Upload: ${formatBytes(iface.bytesSentPerSec)}/s`);
            });
        });
        networkMonitor.start();
        await new Promise(resolve => setTimeout(resolve, 10000));
        networkMonitor.stop();
        console.log('Network interfaces:', interfaces);
        return { interfaces, traffic };
    } catch (err: any) {
        console.error('Network Error:', err.message);
        throw err;
    }
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
    if (Object.keys(req.query).length > 0) {
        console.error('Unexpected query parameters:', Object.keys(req.query));
        res.status(400).json({ errors: [`Unexpected query parameters: ${Object.keys(req.query).join(', ')}`] });
        return
    }
    monitorNetwork()
        .then(data => res.json(data))
        .catch(err => res.status(500).json({ error: `Failed to fetch network data: ${err.message}` }));
});

export default router;