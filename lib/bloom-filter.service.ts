import {Injectable, Inject} from '@nestjs/common';
import Redis from 'ioredis';
import {BLOOM_FILTER_OPTIONS} from "./bloom-filter.constant";
import {IBloomFilterOptions} from "./interfaces/bloom-filter-options.interface";
import {BloomFilterInfoAttribute, BloomFilterInsertFlags, BloomFilterItem, BloomFilterKey} from "./types";

// TODO: Add return interfaces

@Injectable()
export class BloomFilterService {
  constructor(@Inject(BLOOM_FILTER_OPTIONS) protected readonly config: IBloomFilterOptions) {
  }

  private getClient(): Redis {
    return this.config.client
  }

  public async add(key: BloomFilterKey, item: BloomFilterItem) {
    return this.getClient().call('BF.ADD', [key, item]);
  }

  public async card(key: BloomFilterKey) {
    return this.getClient().call('BF.CARD', [key]);
  }

  public async exists(key: BloomFilterKey, item: BloomFilterItem) {
    return this.getClient().call('BF.EXISTS', [key, item]);
  }

  public async info(key: BloomFilterKey, attribute?: BloomFilterInfoAttribute) {
    const infoArgs = [key];
    if (attribute) infoArgs.push(attribute);

    return this.getClient().call('BF.INFO', infoArgs);
  }

  public async insert(key: BloomFilterKey, capacity?: number, errorRate?: number, expansion?: number, flags?: BloomFilterInsertFlags, items?: BloomFilterItem[]) {
    const insertArgs = [key];
    if (capacity) insertArgs.push('CAPACITY', String(capacity));
    if (errorRate) insertArgs.push('ERROR', String(errorRate));
    if (expansion) insertArgs.push('EXPANSION', String(expansion));
    if (flags) insertArgs.push(flags.join(' '));
    if (items) insertArgs.push('ITEMS', items.join(' '));
    return this.getClient().call('BF.INSERT', insertArgs);
  }

  public async loadChunk(key: BloomFilterKey, iterator: number, data: Uint8Array) {
    return this.getClient().call('BF.LOADCHUNK', [key, iterator, Buffer.from(data)]);
  }

  public async mAdd(key: BloomFilterKey, items: BloomFilterItem[]) {
    return this.getClient().call('BF.MADD', [key, ...items]);
  }

  public async mExists(key: BloomFilterKey, items: BloomFilterItem[]) {
    return this.getClient().call('BF.MEXISTS', [key, ...items]);
  }

  public async reserve(key: BloomFilterKey, errorRate: number, capacity: number, expansion: number = 2) {
    let nonScaling: boolean;

    const reserveArgs = [key, errorRate, capacity];
    nonScaling = (expansion > 0);
    if (!nonScaling)
      reserveArgs.push('EXPANSION', expansion);
    else
      reserveArgs.push('NONSCALING');

    return this.getClient().call('BF.RESERVE', reserveArgs);
  }

  public async scanDump(key: BloomFilterKey, iterator: number) {
    return this.getClient().call('BF.SCANDUMP', iterator);
  }


}
