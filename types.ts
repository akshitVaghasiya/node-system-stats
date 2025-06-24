export interface UsagePercentResult {
    percent: number;
    seconds: number;
}

export interface MemoryUsage {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
    arrayBuffers: number;
}

export interface DiskInfo {
    filesystem: string;
    size: number;
    used: number;
    available: number;
    percentUsed: number;
    mountpoint?: string;
}

export interface NetworkInterface {
    name: string;
    ip: string;
    mac?: string;
    type: string;
    netmask: string;
    internal?: boolean;
    operstate: string;
    mtu: number;
    speed: number;
}

export interface NetworkTraffic {
    interface: string;
    bytesReceivedPerSec: number;
    bytesSentPerSec: number;
}

export interface CpuTemperature {
    main: number;
    cores: number[];
}

export interface BatteryInfo {
    hasBattery: boolean;
    percent: number;
    isCharging: boolean;
    timeRemaining?: number;
}

export interface ProcessInfo {
    pid: number;
    name: string;
    cpu: number;
    memory: number;
    memoryPercent: number;
}

export interface SystemSnapshot {
    timestamp: number;
    cpu?: {
        usage: number;
        loadAverage?: { oneMinute: number; fiveMinute: number; fifteenMinute: number };
        temperature?: { main: number; cores: number[] };
    };
    memory?: { used: number; total: number; free: number; percentUsed: number };
    disks?: DiskInfo[];
    battery?: { hasBattery: boolean; percent: number; isCharging: boolean; timeRemaining?: number };
    processes?: ProcessInfo[];
}

export interface CpuStats {
    min: number;
    max: number;
    avg: number;
}

export interface MemoryStats {
    percentUsed: { min: number; max: number; avg: number };
}

export interface DiskInfo {
    filesystem: string;
    size: number;
    used: number;
    available: number;
    percentUsed: number;
    mountpoint?: string;
}

export interface ProcessInfo {
    pid: number;
    name: string;
    cpu: number;
    memory: number;
    memoryPercent: number;
}