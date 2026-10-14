import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedPaywallEntryEngine, defaultBatchedPaywallEntryEngine } from "./batched-paywall-entry-engine.js";
import { BatchedPaywallEntryValidator, defaultBatchedPaywallEntryValidator } from "./batched-paywall-entry-rules.js";
import { BatchedPaywallEntryStore } from "./batched-paywall-entry-store.js";

/** Moves batched paywall entries through their life cycle and keeps a journal of what it did. */
export class BatchedPaywallEntryService {
  store: BatchedPaywallEntryStore;
  validator: BatchedPaywallEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedPaywallEntryEngine;

  constructor(
    store: BatchedPaywallEntryStore,
    validator: BatchedPaywallEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedPaywallEntryEngine,
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
      throw new Error(`batched paywall entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched paywall entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched paywall entry ${code} not found`);
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

export function newBatchedPaywallEntryService(store: BatchedPaywallEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedPaywallEntryService {
  return new BatchedPaywallEntryService(
    store,
    defaultBatchedPaywallEntryValidator(),
    clockValue,
    [],
    defaultBatchedPaywallEntryEngine(flagsValue),
  );
}
