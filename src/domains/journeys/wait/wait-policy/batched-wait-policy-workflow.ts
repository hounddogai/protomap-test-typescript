import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BatchedWaitPolicyEngine, defaultBatchedWaitPolicyEngine } from "./batched-wait-policy-engine.js";
import { BatchedWaitPolicyValidator, defaultBatchedWaitPolicyValidator } from "./batched-wait-policy-rules.js";
import { BatchedWaitPolicyStore } from "./batched-wait-policy-store.js";

/** Moves batched wait policies through their life cycle and keeps a journal of what it did. */
export class BatchedWaitPolicyManager {
  store: BatchedWaitPolicyStore;
  validator: BatchedWaitPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedWaitPolicyEngine;

  constructor(
    store: BatchedWaitPolicyStore,
    validator: BatchedWaitPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedWaitPolicyEngine,
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
      throw new Error(`batched wait policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched wait policy ${code} not found`);
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
      throw new Error(`batched wait policy ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newBatchedWaitPolicyManager(store: BatchedWaitPolicyStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedWaitPolicyManager {
  return new BatchedWaitPolicyManager(
    store,
    defaultBatchedWaitPolicyValidator(),
    clockValue,
    [],
    defaultBatchedWaitPolicyEngine(flagsValue),
  );
}
