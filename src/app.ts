import { loadConfig } from './config.js';
import { buildApp } from './server.js';
import { LookupService } from './service.js';
import { ConsumerStore } from './consumerStore.js';

const config = loadConfig();
const service = new LookupService(config);
const consumerStore = new ConsumerStore(config.CONSUMER_DB_PATH);
const app = await buildApp(config, service, consumerStore);

await app.listen({ port: config.PORT, host: config.HOST });
app.log.info(
  { port: config.PORT, miner: config.MINER_NAME, consumer_db: config.CONSUMER_DB_PATH },
  'veyctum miner api listening',
);