import Redis from 'ioredis';
import { ModuleMetadata, Type } from '@nestjs/common';

export interface IBloomFilterOptions {
  /**
   * Default expansion scale
   */
  expansion?: number;
  /**
   * Default error rate
   */
  errorRate?: number;
  /**
   * IORedis client
   */
  client?: Redis;
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
