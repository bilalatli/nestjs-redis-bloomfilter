import Redis from 'ioredis';
import { ModuleMetadata, Type } from '@nestjs/common';

interface IRedisConnectionConfig {
  host: string,
  port: number,
  username?: string,
  password?: string,
  db?: number,
}

export interface IBloomFilterOptions {
  /**
   * IORedis client
   */
  client?: Redis;

  /**
   * Create connection configurations
   */
  connection?: IRedisConnectionConfig,
}

export interface IBloomFilterOptionsFactory {
  createBloomFilterOptions(): Promise<IBloomFilterOptions> | IBloomFilterOptions;
}

export interface IBloomFilterAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
  useExisting?: Type<IBloomFilterOptionsFactory>;
  useClass?: Type<IBloomFilterOptionsFactory>;
  useFactory?: (...args: any[]) => Promise<IBloomFilterOptions> | IBloomFilterOptions;
  inject?: any[];
}
