export class FilterAlreadyExists extends Error {
  constructor(key?: string) {
    super(`Filter key [${key}] already exists`);
  }
}
