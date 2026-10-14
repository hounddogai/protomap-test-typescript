import * as clock from "../../../../kit/clock.js";
import { TierBatchEngine, defaultTierBatchEngine } from "./tier-batch-engine.js";
import { TierBatchValidator, defaultTierBatchValidator } from "./tier-batch-rules.js";
import { TierBatchStore } from "./tier-batch-store.js";

/** Moves tier batches through their life cycle and keeps a journal of what it did. */
export class TierBatchWorkflow {
  store: TierBatchStore;
  validator: TierBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TierBatchEngine;

  constructor(
    store: TierBatchStore,
    validator: TierBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TierBatchEngine,
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
      throw new Error(`tier batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier batch ${code} not found`);
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
      throw new Error(`tier batch ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTierBatchWorkflow(store: TierBatchStore, clockValue: clock.Clock): TierBatchWorkflow {
  return new TierBatchWorkflow(store, defaultTierBatchValidator(), clockValue, [], defaultTierBatchEngine());
}
