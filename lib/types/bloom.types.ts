export type BloomFilterKey = string;
export type BloomFilterItem = string;
export type BloomFilterInfoAttribute = 'CAPACITY' | 'SIZE' | 'FILTERS' | 'ITEMS' | 'EXPANSION';
export type BloomFilterInsertFlagType = 'NOCREATE' | 'NONSCALING';
export type BloomFilterInsertFlags = BloomFilterInsertFlagType[];
