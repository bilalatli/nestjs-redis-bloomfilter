import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';
import { BLOOM_FILTER_OPTIONS } from './bloom-filter.constant';
import { IBloomFilterInfo, IBloomFilterOptions } from './interfaces';
import { BloomFilterInfoAttribute, BloomFilterInsertFlags, BloomFilterItem, BloomFilterKey } from './types';
import { BloomFilterUnknownException, FilterAlreadyExists, NonScalingFilterIsFull, BloomFilterInstallationException } from './exceptions';

@Injectable()
export class BloomFilterService {
  /**
   * Replace map for BF.INFO command
   * @private
   */
  private readonly INFO_KEY_REPLACE = {
    Capacity: 'CAPACITY',
    Size: 'SIZE',
    'Number of filters': 'NUMBER_OF_FILTERS',
    'Number of items inserted': 'NUMBER_OF_ITEMS',
    'Expansion rate': 'EXPANSION_RATE',
  };

  constructor(@Inject(BLOOM_FILTER_OPTIONS) protected readonly config: IBloomFilterOptions) {
    if (!this.config.client && !this.config.connection) {
      throw new BloomFilterInstallationException(`Connection config or client must defined in options`);
    }
    if (!this.config.client) {
      this.config.client = new Redis({
        host: this.config.connection.host || '127.0.0.1',
        port: this.config.connection.port || 6379,
        db: this.config.connection.db,
        username: this.config.connection.username,
        password: this.config.connection.password,
      });
    }
  }

  private getClient(): Redis {
    return this.config.client;
  }

  /**
   * Check connection with ping command
   */
  public async isConnected() {
    return (await this.config.client.ping()) === 'PONG';
  }

  /**
   * Adds an item to a Bloom filter.
   *
   * @link https://redis.io/docs/latest/commands/bf.add/
   *
   * @param key - Key of bloom filter
   * @param item - Item
   *
   * @throws NonScalingFilterIsFull
   * Thrown if given non-scaling bloom filter key is reached to maximum capacity
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async add(key: BloomFilterKey, item: BloomFilterItem) {
    return this.getClient()
      .call('BF.ADD', [key, item])
      .then(response => {
        return response === 1;
      })
      .catch((err: string) => {
        if (err.indexOf('non scaling filter is full')) {
          throw new NonScalingFilterIsFull(key);
        }
        throw new BloomFilterUnknownException(err);
      });
  }

  /**
   * Returns the cardinality of a Bloom filter - number of items that were added to a Bloom filter and detected as unique (items that caused at least one bit to be set in at least one sub-filter)
   *
   * @link https://redis.io/docs/latest/commands/bf.card/
   *
   * @param key - Bloom filter key
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async card(key: BloomFilterKey): Promise<number> {
    return (await this.getClient()
      .call('BF.CARD', [key])
      .catch((err: string) => {
        throw new BloomFilterUnknownException(err);
      })) as number;
  }

  /**
   * Determines whether a given item was added to a Bloom filter
   *
   * @link https://redis.io/docs/latest/commands/bf.exists/
   *
   * @param key - Bloom filter key
   * @param item - Item
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async exists(key: BloomFilterKey, item: BloomFilterItem): Promise<boolean> {
    return this.getClient()
      .call('BF.EXISTS', [key, item])
      .then(response => {
        return response === '1';
      })
      .catch((err: string) => {
        throw new BloomFilterUnknownException(err);
      });
  }

  /**
   * Returns information about a Bloom filter
   * When no optional argument is specified: return all information fields
   *
   * @link https://redis.io/docs/latest/commands/bf.info/
   *
   * @param key - Bloom filter key
   * @param attribute - Optional attribute
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async info(key: BloomFilterKey, attribute?: BloomFilterInfoAttribute): Promise<number | IBloomFilterInfo> {
    const infoArgs = [key];
    if (attribute) infoArgs.push(attribute);

    const result = await this.getClient()
      .call('BF.INFO', infoArgs)
      .catch((err: string) => {
        throw new BloomFilterUnknownException(err);
      });
    if (attribute) {
      return result as number;
    }

    // @ts-ignore - Ignore for current statement
    let response: IBloomFilterInfo = {};
    for (let i = 0; i < (result as any[]).length; i += 2) {
      let aKey = (result as string[])[i];
      const aVal = (result as number[])[i + 1];

      response[this.INFO_KEY_REPLACE[aKey] || aKey] = aVal ?? 0;
    }
    return response as IBloomFilterInfo;
  }

  /**
   * Creates a new Bloom filter if the key does not exist using the specified error rate, capacity, and expansion, then adds all specified items to the Bloom Filter
   *
   * @link https://redis.io/docs/latest/commands/bf.insert/
   *
   * @param key - Bloom filter key
   * @param items - Insert items
   * @param capacity - Capacity
   * @param errorRate - Error rate
   * @param expansion - Expansion rate
   * @param flags - Insert flags
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async insert(key: BloomFilterKey, items: BloomFilterItem[], capacity?: number, errorRate?: number, expansion?: number, flags?: BloomFilterInsertFlags): Promise<number[]> {
    const insertArgs = [key];
    if (capacity) insertArgs.push('CAPACITY', String(capacity));
    if (errorRate) insertArgs.push('ERROR', String(errorRate));
    if (expansion) insertArgs.push('EXPANSION', String(expansion));
    if (flags) insertArgs.push(flags.join(' '));
    if (items) insertArgs.push('ITEMS', items.join(' '));
    return (await this.getClient()
      .call('BF.INSERT', insertArgs)
      .catch((err: string) => {
        throw new BloomFilterUnknownException(err);
      })) as number[];
  }

  /**
   * Restores a Bloom filter previously saved using BF.SCANDUMP
   *
   * @link https://redis.io/docs/latest/commands/bf.loadchunk/
   * @link https://redis.io/docs/latest/commands/bf.scandump/
   *
   * @param key - Bloom filter key
   * @param iterator - Iterator
   * @param data - Binary chunk data
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async loadChunk(key: BloomFilterKey, iterator: number, data: Buffer) {
    return this.getClient()
      .call('BF.LOADCHUNK', [key, iterator, data])
      .then(response => {
        return response === 'OK';
      })
      .catch((err: string) => {
        throw new BloomFilterUnknownException(err);
      });
  }

  /**
   * Adds one or more items to a Bloom filter
   *
   * @link https://redis.io/docs/latest/commands/bf.madd/
   *
   * @param key - Bloom filter key
   * @param items - Filter items
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async mAdd(key: BloomFilterKey, items: BloomFilterItem[]) {
    return (await this.getClient()
      .call('BF.MADD', [key, ...items])
      .catch((err: string) => {
        throw new BloomFilterUnknownException(err);
      })) as number[];
  }

  /**
   * Determines whether one or more items were added to a Bloom filter
   *
   * @link https://redis.io/docs/latest/commands/bf.mexists/
   *
   * @param key - Bloom filter key
   * @param items - Filter items
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async mExists(key: BloomFilterKey, items: BloomFilterItem[]) {
    return (await this.getClient()
      .call('BF.MEXISTS', [key, ...items])
      .catch((err: string) => {
        throw new BloomFilterUnknownException(err);
      })) as number[];
  }

  /**
   * Creates an empty Bloom filter with a single sub-filter for the initial specified capacity and with an upper bound error_rate.
   *
   * By default, the filter auto-scales by creating additional sub-filters when capacity is reached. The new sub-filter is created with size of the previous sub-filter multiplied by expansion.
   *
   * Though the filter can scale up by creating sub-filters, it is recommended to reserve the estimated required capacity since maintaining and querying sub-filters requires additional memory (each sub-filter uses an extra bits and hash function) and consume further CPU time than an equivalent filter that had the right capacity at creation time.
   *
   * The number of hash functions is -log(error)/ln(2)^2. The number of bits per item is -log(error)/ln(2) ≈ 1.44.
   *
   * + 1% error rate requires 7 hash functions and 10.08 bits per item.
   * + 0.1% error rate requires 10 hash functions and 14.4 bits per item.
   * + 0.01% error rate requires 14 hash functions and 20.16 bits per item
   *
   * @link https://redis.io/docs/latest/commands/bf.reserve/
   *
   * @param key - Bloom filter key
   * @param errorRate - The desired probability for false positives. The rate is a decimal value between 0 and 1. For example, for a desired false positive rate of 0.1% (1 in 1000), error_rate should be set to 0.001
   * @param capacity - The number of entries intended to be added to the filter. If your filter allows scaling, performance will begin to degrade after adding more items than this number. The actual degradation depends on how far the limit has been exceeded. Performance degrades linearly with the number of sub-filters
   * @param expansion - When capacity is reached, an additional sub-filter is created. The size of the new sub-filter is the size of the last sub-filter multiplied by expansion, specified as a positive integer
   *
   * @throws FilterAlreadyExists
   * Thrown if filter key already exists
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async reserve(key: BloomFilterKey, errorRate: number, capacity: number, expansion: number = 2): Promise<boolean> {
    let nonScaling: boolean;

    const reserveArgs = [key, errorRate, capacity];
    nonScaling = expansion > 0;
    if (!nonScaling) reserveArgs.push('EXPANSION', expansion);
    else reserveArgs.push('NONSCALING');

    return this.getClient()
      .call('BF.RESERVE', reserveArgs)
      .then(response => {
        return response === 'OK';
      })
      .catch((err: string) => {
        if (err.indexOf('item exists')) {
          throw new FilterAlreadyExists(key);
        }
        throw new BloomFilterUnknownException(err);
      });
  }

  /**
   * Begins an incremental save of the Bloom filter.
   *
   * This command is useful for large Bloom filters that cannot fit into the DUMP and RESTORE model.
   *
   * The first time this command is called, the value of iter should be 0.
   *
   * This command returns successive (iter, data) pairs until (0, NULL) to indicate completion
   *
   * @link https://redis.io/docs/latest/commands/bf.scandump/
   *
   * @param key - Bloom filter key
   * @param iterator - Iterator
   *
   * @throws BloomFilterUnknownException
   * Thrown if exception type don't defined
   */
  public async scanDump(key: BloomFilterKey, iterator: number) {
    return await this.getClient()
      .call('BF.SCANDUMP', iterator)
      .then((response: any[]) => {
        return [response[0] as number, Buffer.from(response[1])];
      })
      .catch((err: string) => {
        throw new BloomFilterUnknownException(err);
      });
  }
}
