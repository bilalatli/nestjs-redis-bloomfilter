export class NonScalingFilterIsFull extends Error {
  constructor(key?: string) {
    super(`Non-scaling filter [${key}] is reached max capacity`);
  }
}
