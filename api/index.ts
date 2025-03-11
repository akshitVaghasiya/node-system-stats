import { Router } from 'express';
const route = Router();

import inventory from './inventory';

route.use("/inventory", inventory);

export default route;