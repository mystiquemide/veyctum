import { loadConfig } from './config.js';
import { buildApp } from './server.js';
import { LookupService } from './service.js';

const config = loadConfig();
const service = new LookupService(config);
const app = await buildApp(config, service);

await app.listen({ port: config.PORT, host: config.HOST });
app.log.info({ port: config.PORT, miner: config.MINER_NAME }, 'veyctum miner api listening');