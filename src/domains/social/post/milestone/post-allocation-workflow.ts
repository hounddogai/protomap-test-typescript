import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PostAllocationEngine, defaultPostAllocationEngine } from "./post-allocation-engine.js";
import { PostAllocationValidator, defaultPostAllocationValidator } from "./post-allocation-rules.js";
import { PostAllocationStore } from "./post-allocation-store.js";

/** Moves post allocations through their life cycle and keeps a journal of what it did. */
export class PostAllocationService {
  store: PostAllocationStore;
  validator: PostAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PostAllocationEngine;

  constructor(
    store: PostAllocationStore,
    validator: PostAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PostAllocationEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`post allocation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPostAllocationService(store: PostAllocationStore, clockValue: clock.Clock, flagsValue: flags.Registry): PostAllocationService {
  return new PostAllocationService(
    store,
    defaultPostAllocationValidator(),
    clockValue,
    [],
    defaultPostAllocationEngine(flagsValue),
  );
}
