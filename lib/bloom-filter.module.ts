import { Module, DynamicModule, Provider } from '@nestjs/common';
import { BLOOM_FILTER_OPTIONS } from './bloom-filter.constant';
import { IBloomFilterAsyncOptions, IBloomFilterOptions, IBloomFilterOptionsFactory } from './interfaces';
import { BloomFilterService } from './bloom-filter.service';

function createBloomFilterProvider(options: IBloomFilterOptions): any[] {
  return [{ provide: BLOOM_FILTER_OPTIONS, useValue: options || {} }];
}

@Module({
  imports: [],
  providers: [BloomFilterService],
  exports: [BloomFilterService],
})
export class BloomFilterModule {
  static register(options: IBloomFilterOptions): DynamicModule {
    return {
      module: BloomFilterModule,
      providers: createBloomFilterProvider(options),
    };
  }

  static registerAsync(options: IBloomFilterAsyncOptions): DynamicModule {
    return {
      module: BloomFilterModule,
      imports: options.imports || [],
      providers: this.createAsyncProviders(options),
    };
  }

  private static createAsyncProviders(options: IBloomFilterAsyncOptions): Provider[] {
    if (options.useExisting || options.useFactory) {
      return [this.createAsyncOptionsProvider(options)];
    }
    return [
      this.createAsyncOptionsProvider(options),
      {
        provide: options.useClass,
        useClass: options.useClass,
      },
    ];
  }

  private static createAsyncOptionsProvider(options: IBloomFilterAsyncOptions): Provider {
    if (options.useFactory) {
      return {
        provide: BLOOM_FILTER_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      };
    }
    return {
      provide: BLOOM_FILTER_OPTIONS,
      useFactory: async (optionsFactory: IBloomFilterOptionsFactory) => await optionsFactory.createBloomFilterOptions(),
      inject: [options.useExisting || options.useClass],
    };
  }
}
