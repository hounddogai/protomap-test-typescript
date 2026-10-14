import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedModelBundleEngine, defaultBatchedModelBundleEngine } from "./batched-model-bundle-engine.js";
import { BatchedModelBundleValidator, defaultBatchedModelBundleValidator } from "./batched-model-bundle-rules.js";
import { BatchedModelBundleStore } from "./batched-model-bundle-store.js";

/** Moves batched model bundles through their life cycle and keeps a journal of what it did. */
export class BatchedModelBundleService {
  store: BatchedModelBundleStore;
  validator: BatchedModelBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedModelBundleEngine;

  constructor(
    store: BatchedModelBundleStore,
    validator: BatchedModelBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedModelBundleEngine,
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
      throw new Error(`batched model bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched model bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched model bundle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedModelBundleService(store: BatchedModelBundleStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedModelBundleService {
  return new BatchedModelBundleService(
    store,
    defaultBatchedModelBundleValidator(),
    clockValue,
    [],
    defaultBatchedModelBundleEngine(flagsValue),
  );
}
