
import { MikroORMOptions, ReflectMetadataProvider } from '@mikro-orm/core';
import { MongoDriver } from '@mikro-orm/mongodb';
import entities from './1_database/entities';
import { AppConfig } from './0_config/AppConfig';


const appConfig = AppConfig.get()

const config: Partial<MikroORMOptions<MongoDriver>> = {
  entities: entities,
  clientUrl: appConfig.dbUrl,
  metadataProvider: ReflectMetadataProvider,
  debug: false,
  type: 'mongo'
};

export default config;