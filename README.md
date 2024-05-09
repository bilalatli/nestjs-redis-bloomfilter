# @bilalatli/nestjs-redis-bloomfilter
A Bloom filter is a probabilistic data structure in Redis Stack that enables you to check if an element is present in a set using a very small memory space of a fixed size.

Instead of storing all of the elements in the set, Bloom Filters store only the elements' hashed representation, thus sacrificing some precision. The trade-off is that Bloom Filters are very space-efficient and fast.

### Use Cases
- Financial fraud detection (Finance)
- Ad placement (Retail, Advertising)
- Check if a username is taken (SaaS, Content publishing platforms)
- ...

---

This package provides an extension for [NestJS](https://github.com/nestjs/nest) to enable the use of the RedisStack - Bloom Filter module

## Installation
```
npm install @bilalatli/nestjs-redis-bloomfilter
```

## Module Installation #1

In this example you must install [**@nestjs-modules/ioredis**](https://www.npmjs.com/package/@nestjs-modules/ioredis) package.

Or you can use another method to inject existing ioredis client into the module. 

```Typescript
// app.module.ts
import { getRedisConnectionToken, RedisModule } from '@nestjs-modules/ioredis';
import { BloomFilterModule, BloomFilterService } from '@bilalatli/nestjs-redis-bloomfilter';

@Module({
  imports: [
    ...
    // You should import RedisModule first
    RedisModule.forRoot({
      type: 'single',
      url: 'redis://localhost:6379',
    }),
    BloomFilterModule.registerAsync({
      inject: [getRedisConnectionToken()],
      useFactory: async (redis: Redis): Promise<IBloomFilterOptions> => {
        return {
          client: redis,
        };
      },
    }),
  ]
})
export class AppModule {
}
```

## Module Installation #2

In this example you must install [**@ioredis**](https://www.npmjs.com/package/ioredis) package.

```Typescript
// app.module.ts
import { BloomFilterModule, BloomFilterService } from '@bilalatli/nestjs-redis-bloomfilter';

@Module({
  imports: [
    ...
    BloomFilterModule.registerAsync({
      useFactory: async (): Promise<IBloomFilterOptions> => {
        return {
          connection: {
            host: '127.0.0.1', // Default: 127.0.0.1
            port: 6379, // Default: 6379
            // username: '', // @Optional
            // password: '', // @Optional
            // db: 0 // @Optional
          }
        };
      },
    }),
  ]
})
export class AppModule {
}
```

## Usage Example

```Typescript
import {Inject, Injectable} from "@nestjs/common";
import {BloomFilterService} from "@bilalatli/nestjs-redis-bloomfilter";

@Injectable()
export class AppService {
  @Inject() bf: BloomFilterService;

  public async example() {
    const key = 'username';

    // Reserve `username` filter with 0.1% error rate (false positive) & 20.000 item capacity > Expansion rate : 2
    await this.bf.reserve(key, 0.1, 20000, 2);

    // Add my_username1 into `username` filter
    await this.bf.add(key, 'my_username1');

    // Add array into the `username` filter
    await this.bf.mAdd(key, ['my_username1','my_username2','my_username3']);
  }

  public async isUsernameExists() {
    const isUsernameExists = await this.bf.exists('username','my_username1');
    if (isUsernameExists === false) {
      // my_username1 don't exists on database & filter
    } else {
      // my_username1 could exist in the database. The likelihood of encountering a false-positive output is determined based on the error rate defined for the filter
    }
  }
}
```

# Methods List

## Method: `add`

Adds an item to a Bloom filter.

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.add/)
- **Parameters**:
    - `key`: Key of the bloom filter.
    - `item`: Item to add.
- **Throws**:
    - `NonScalingFilterIsFull`: Thrown if the given non-scaling bloom filter key has reached its maximum capacity.
    - `BloomFilterUnknownException`: Thrown if the exception type is not defined.

---

## Method: `card`

Returns the cardinality of a Bloom filter, which is the number of items that were added to the Bloom filter and detected as unique (items that caused at least one bit to be set in at least one sub-filter).

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.card/)
- **Parameters**:
    - `key`: The key of the Bloom filter.
- **Throws**:
    - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<number>`: A promise that resolves to the cardinality of the Bloom filter.

---

## Method: `exists`

Determines whether a given item was added to a Bloom filter.

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.exists/)
- **Parameters**:
    - `key`: The key of the Bloom filter.
    - `item`: The item to check for existence.
- **Throws**:
    - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<boolean>`: A promise that resolves to a boolean indicating whether the item exists in the Bloom filter.

---

## Method: `info`

Returns information about a Bloom filter. When no optional argument is specified, it returns all information fields.

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.info/)
- **Parameters**:
  - `key`: The key of the Bloom filter.
  - `attribute` (optional): Optional attribute.
- **Throws**:
  - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<number | IBloomFilterInfo>`: A promise that resolves to either a number or an object containing information about the Bloom filter.

If `attribute` is provided, the return type is `number`, representing the value of the specific attribute. Otherwise, the return type is `IBloomFilterInfo`, an object containing various information fields about the Bloom filter.

---

## Method: `insert`

Creates a new Bloom filter if the key does not exist using the specified error rate, capacity, and expansion, then adds all specified items to the Bloom Filter.

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.insert/)
- **Parameters**:
  - `key`: The key of the Bloom filter.
  - `items`: The items to insert into the Bloom filter.
  - `capacity` (optional): The capacity of the Bloom filter.
  - `errorRate` (optional): The error rate of the Bloom filter.
  - `expansion` (optional): The expansion rate of the Bloom filter.
  - `flags` (optional): Insert flags.
- **Throws**:
  - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<number[]>`: A promise that resolves to an array of numbers representing the results of the insert operation for each item.

This method creates a new Bloom filter with the specified parameters if the key does not exist, and then inserts all specified items into the Bloom filter. It returns an array of numbers representing the results of the insert operation for each item.

---

## Method: `loadChunk`

Restores a Bloom filter previously saved using BF.SCANDUMP.

- **Link**: [BF.LOADCHUNK Documentation](https://redis.io/docs/latest/commands/bf.loadchunk/)
- **Related Link**: [BF.SCANDUMP Documentation](https://redis.io/docs/latest/commands/bf.scandump/)
- **Parameters**:
  - `key`: The key of the Bloom filter.
  - `iterator`: The iterator.
  - `data`: Binary chunk data.
- **Throws**:
  - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<boolean>`: A promise that resolves to a boolean indicating whether the restoration was successful.

This method restores a Bloom filter previously saved using BF.SCANDUMP. It takes the key of the Bloom filter, the iterator, and the binary chunk data as parameters. It returns a promise that resolves to a boolean indicating whether the restoration was successful.

---

## Method: `mAdd`

Adds one or more items to a Bloom filter.

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.madd/)
- **Parameters**:
  - `key`: The key of the Bloom filter.
  - `items`: An array of items to add to the Bloom filter.
- **Throws**:
  - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<number[]>`: A promise that resolves to an array of numbers representing the results of the add operation for each item.

This method adds one or more items to a Bloom filter specified by the key. It returns a promise that resolves to an array of numbers representing the results of the add operation for each item.

---

## Method: `mExists`

Determines whether one or more items were added to a Bloom filter.

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.mexists/)
- **Parameters**:
  - `key`: The key of the Bloom filter.
  - `items`: An array of items to check for existence in the Bloom filter.
- **Throws**:
  - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<number[]>`: A promise that resolves to an array of numbers representing the results of the mExists operation for each item.

This method determines whether one or more items were added to a Bloom filter specified by the key. It returns a promise that resolves to an array of numbers representing the results of the mExists operation for each item.

---

## Method: `reserve`

Creates an empty Bloom filter with a single sub-filter for the initial specified capacity and with an upper bound error rate.

By default, the filter auto-scales by creating additional sub-filters when capacity is reached. The new sub-filter is created with a size of the previous sub-filter multiplied by the expansion parameter.

Though the filter can scale up by creating sub-filters, it is recommended to reserve the estimated required capacity since maintaining and querying sub-filters requires additional memory (each sub-filter uses extra bits and hash functions) and consumes further CPU time than an equivalent filter that had the right capacity at creation time.

The number of hash functions is calculated using the formula: -log(errorRate)/ln(2)^2. The number of bits per item is calculated using the formula: -log(errorRate)/ln(2) ≈ 1.44.

For example:
- A 1% error rate requires 7 hash functions and 10.08 bits per item.
- A 0.1% error rate requires 10 hash functions and 14.4 bits per item.
- A 0.01% error rate requires 14 hash functions and 20.16 bits per item.

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.reserve/)
- **Parameters**:
  - `key`: The key of the Bloom filter.
  - `errorRate`: The desired probability for false positives, specified as a decimal value between 0 and 1.
  - `capacity`: The number of entries intended to be added to the filter.
  - `expansion` (optional): When capacity is reached, an additional sub-filter is created. The size of the new sub-filter is the size of the last sub-filter multiplied by the expansion parameter, specified as a positive integer. Default value is 2.
- **Throws**:
  - `FilterAlreadyExists`: Thrown if the filter key already exists.
  - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<boolean>`: A promise that resolves to a boolean indicating whether the reservation was successful.

---

## Method: `scanDump`

Begins an incremental save of the Bloom filter.

This command is useful for large Bloom filters that cannot fit into the DUMP and RESTORE model.

The first time this command is called, the value of the iterator should be 0.

This command returns successive (iter, data) pairs until (0, NULL) to indicate completion.

- **Link**: [Documentation](https://redis.io/docs/latest/commands/bf.scandump/)
- **Parameters**:
  - `key`: The key of the Bloom filter.
  - `iterator`: The iterator.
- **Throws**:
  - `BloomFilterUnknownException`: Thrown if the exception type is not defined.
- **Return Type**: `Promise<[number, Buffer]>`: A promise that resolves to an array containing the iterator value and a Buffer object representing the data.

This method begins an incremental save of the Bloom filter specified by the key. It returns successive (iterator, data) pairs until (0, NULL) to indicate completion.
