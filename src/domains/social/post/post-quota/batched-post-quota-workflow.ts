import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedPostQuotaEngine, defaultBatchedPostQuotaEngine } from "./batched-post-quota-engine.js";
import { BatchedPostQuotaValidator, defaultBatchedPostQuotaValidator } from "./batched-post-quota-rules.js";
import { BatchedPostQuotaStore } from "./batched-post-quota-store.js";

/** Moves batched post quotas through their life cycle and keeps a journal of what it did. */
export class BatchedPostQuotaService {
  store: BatchedPostQuotaStore;
  validator: BatchedPostQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedPostQuotaEngine;

  constructor(
    store: BatchedPostQuotaStore,
    validator: BatchedPostQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedPostQuotaEngine,
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
      throw new Error(`batched post quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched post quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched post quota ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedPostQuotaService(store: BatchedPostQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedPostQuotaService {
  return new BatchedPostQuotaService(
    store,
    defaultBatchedPostQuotaValidator(),
    clockValue,
    [],
    defaultBatchedPostQuotaEngine(flagsValue),
  );
}
