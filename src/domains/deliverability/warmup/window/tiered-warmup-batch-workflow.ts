import * as clock from "../../../../kit/clock.js";
import { TieredWarmupBatchEngine, defaultTieredWarmupBatchEngine } from "./tiered-warmup-batch-engine.js";
import { TieredWarmupBatchValidator, defaultTieredWarmupBatchValidator } from "./tiered-warmup-batch-rules.js";
import { TieredWarmupBatchStore } from "./tiered-warmup-batch-store.js";

/** Moves tiered warmup batches through their life cycle and keeps a journal of what it did. */
export class TieredWarmupBatchService {
  store: TieredWarmupBatchStore;
  validator: TieredWarmupBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredWarmupBatchEngine;

  constructor(
    store: TieredWarmupBatchStore,
    validator: TieredWarmupBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredWarmupBatchEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered warmup batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered warmup batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered warmup batch ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTieredWarmupBatchService(store: TieredWarmupBatchStore, clockValue: clock.Clock): TieredWarmupBatchService {
  return new TieredWarmupBatchService(
    store,
    defaultTieredWarmupBatchValidator(),
    clockValue,
    [],
    defaultTieredWarmupBatchEngine(),
  );
}
