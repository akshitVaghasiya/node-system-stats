const { usagePercent, totalCores, cpuModel, avgClockMHz, clockMHz, showMemoryUsage, showTotalMemory, showFreeMemory, getDiskInfo, formatBytes, getNetworkInterfaces, NetworkMonitor, getCpuTemperature, getBatteryInfo, getTopProcesses, SystemMonitor } = require('node-system-stats');
import {
    UsagePercentResult,
    MemoryUsage,
    DiskInfo,
    NetworkInterface,
    NetworkTraffic,
    CpuTemperature,
    BatteryInfo,
    ProcessInfo,
    SystemSnapshot,
    CpuStats,
    MemoryStats
} from './types';

// CPU Usage
async function checkCpu(): Promise<void> {
    try {
        const result: UsagePercentResult = await usagePercent();
        console.log(`CPU usage: ${result.percent}% over ${result.seconds} seconds`);

        const core0Usage: UsagePercentResult = await usagePercent({ coreIndex: 0, sampleMs: 2000 });
        console.log(`Core 0 usage: ${core0Usage.percent}%`);
        console.log(`Total cores: ${totalCores}`);
        console.log(`CPU model: ${cpuModel}`);
        console.log(`Average clock speed: ${avgClockMHz()} MHz`);

        const allSpeeds: number[] = clockMHz() as number[];
        console.log("All core speeds:", allSpeeds);

        const core1Speed: number = clockMHz(1) as number;
        console.log(`Core 1 speed: ${core1Speed} MHz`);
    } catch (err: unknown) {
        console.error('CPU Error:', err);
    }
}

// Memory Usage
function checkMemory(): void {
    const memUsage: MemoryUsage = showMemoryUsage();
    console.log('Memory usage:', memUsage);

    console.log(`Total memory: ${showTotalMemory()} MB`);
    console.log(`Total memory: ${showTotalMemory(true)} GB`);

    console.log(`Free memory: ${showFreeMemory()} MB`);
    console.log(`Free memory: ${showFreeMemory(true)} GB`);
}

// Disk Usage
async function checkDisks(): Promise<void> {
    try {
        const allDisks: DiskInfo[] = await getDiskInfo();
        allDisks.forEach(disk => {
            console.log(`Disk ${disk.filesystem}:`);
            console.log(`  Total: ${formatBytes(disk.size)}`);
            console.log(`  Used: ${formatBytes(disk.used)} (${disk.percentUsed}%)`);
            console.log(`  Available: ${formatBytes(disk.available)}`);
        });

        const specificDisk: DiskInfo = await getDiskInfo("C:\\Users") as DiskInfo;
        console.log("Specific path disk info:", specificDisk);
    } catch (err: unknown) {
        console.error('Disk Error:', err);
    }
}

// Network Monitoring
async function monitorNetwork(): Promise<void> {
    try {
        const interfaces: NetworkInterface[] = await getNetworkInterfaces();
        console.log('Network interfaces:', interfaces);

        const networkMonitor = new NetworkMonitor(1000);
        networkMonitor.on('data', (trafficData: NetworkTraffic[]) => {
            trafficData.forEach(iface => {
                console.log(`Interface: ${iface.interface}`);
                console.log(`  Download: ${formatBytes(iface.bytesReceivedPerSec)}/s`);
                console.log(`  Upload: ${formatBytes(iface.bytesSentPerSec)}/s \n`);
            });
        });
        networkMonitor.start();
        await new Promise(resolve => setTimeout(resolve, 10000));
        networkMonitor.stop();
    } catch (err: unknown) {
        console.error('Network Error:', err);
    }
}

// Hardware Status (CPU Temp & Battery)
async function checkHardwareStatus(): Promise<void> {
    try {
        const temp: CpuTemperature | null = await getCpuTemperature();
        if (temp) {
            console.log(`CPU temperature: ${temp.main}°C`);
            console.log(`Individual cores: ${temp.cores.join('°C, ')}°C`);
        } else {
            console.log("CPU temperature information not available");
        }

        const battery: BatteryInfo = await getBatteryInfo();
        if (battery.hasBattery) {
            console.log(`Battery level: ${battery.percent}%`);
            console.log(`Charging: ${battery.isCharging ? 'Yes' : 'No'}`);
            if (battery.timeRemaining) {
                console.log(`Time remaining: ${Math.floor(battery.timeRemaining / 60)}h ${battery.timeRemaining % 60}m`);
            }
        } else {
            console.log("No battery detected");
        }
    } catch (err: unknown) {
        console.error('Hardware Error:', err);
    }
}

// Process Monitoring
async function monitorProcesses(): Promise<void> {
    try {
        const cpuProcesses: ProcessInfo[] = await getTopProcesses(5, 'cpu');
        console.log("Top CPU processes:", cpuProcesses);

        const memProcesses: ProcessInfo[] = await getTopProcesses(5, 'memory');
        console.log("Top memory processes:", memProcesses.filter(proc => !isNaN(proc.pid)));

        console.log("Top CPU-intensive processes:");
        cpuProcesses.forEach(proc => {
            console.log(`${proc.name} (PID ${proc.pid}): CPU ${proc.cpu}%, Memory ${formatBytes(proc.memory)}`);
        });
    } catch (err: unknown) {
        console.error('Process Error:', err);
    }
}

// System Monitoring Dashboard
function startSystemMonitor(): void {
    try {
        const monitor = new SystemMonitor({
            interval: 2000,
            maxHistory: 30
        });

        monitor.on('data', (snapshot: SystemSnapshot) => {
            console.clear();

            console.log(`=== System Monitor ===`);
            console.log(`Time: ${new Date(snapshot.timestamp).toLocaleTimeString()}`);
            console.log(`\nCPU: ${snapshot.cpu.usage.toFixed(1)}%`);
            console.log(`Load average: ${snapshot.cpu.loadAverage.oneMinute.toFixed(2)}`);

            if (snapshot.cpu.temperature) {
                console.log(`CPU Temperature: ${snapshot.cpu.temperature.main}°C`);
            }

            console.log(`\nMemory:`);
            console.log(`  Used: ${formatBytes(snapshot.memory.used)} / ${formatBytes(snapshot.memory.total)}`);
            console.log(`  Free: ${formatBytes(snapshot.memory.free)}`);
            console.log(`  Usage: ${snapshot.memory.percentUsed.toFixed(1)}%`);

            if (snapshot.disks) {
                console.log(`\nDisk Usage:`);
                snapshot.disks.forEach(disk => {
                    console.log(`  ${disk.filesystem}: ${disk.percentUsed}% used`);
                });
            }

            if (snapshot.battery && snapshot.battery.hasBattery) {
                console.log(`\nBattery: ${snapshot.battery.percent}% ${snapshot.battery.isCharging ? '(charging)' : ''}`);
            }

            if (snapshot.processes) {
                console.log(`\nTop Processes:`);
                snapshot.processes.slice(0, 3).forEach(proc => {
                    console.log(`  ${proc.name}: CPU ${proc.cpu.toFixed(1)}%, Mem ${formatBytes(proc.memory)}`);
                });
            }
        });

        monitor.start(true);

        setTimeout(() => {
            const cpuStats: CpuStats = monitor.getCpuStats();
            const memoryStats: MemoryStats = monitor.getMemoryStats();

            console.log("\n=== Statistics ===");
            console.log(`CPU Usage: Min ${cpuStats.min}%, Max ${cpuStats.max}%, Avg ${cpuStats.avg}%`);
            console.log(`Memory Usage: Min ${memoryStats.percentUsed.min}%, Max ${memoryStats.percentUsed.max}%, Avg ${memoryStats.percentUsed.avg}%`);

            setTimeout(() => monitor.stop(), 30000);
        }, 30000);
    } catch (err: unknown) {
        console.error('Monitor Error:', err);
    }
}

// Run all checks
async function run(): Promise<void> {
    console.log('=== System Stats ===');
    await checkCpu();
    checkMemory();
    await checkDisks();
    await monitorNetwork();
    await checkHardwareStatus();
    await monitorProcesses();
    startSystemMonitor();
}

run().catch(err => console.error('Run Error:', err));