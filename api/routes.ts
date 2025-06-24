import { Router } from 'express';
import cpuRouter from './cpu';
import memoryRouter from './memory';
import disksRouter from './disks';
import networkRouter from './network';
import hardwareRouter from './hardware';
import processesRouter from './processes';
import systemRouter from './system';

const router = Router();

router.use('/cpu', cpuRouter);
router.use('/memory', memoryRouter);
router.use('/disks', disksRouter);
router.use('/network', networkRouter);
router.use('/hardware', hardwareRouter);
router.use('/processes', processesRouter);
router.use('/system', systemRouter);

export default router;