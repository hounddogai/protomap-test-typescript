import * as clock from "../../../../kit/clock.js";
import { BatchedJourneyPolicyEngine, defaultBatchedJourneyPolicyEngine } from "./batched-journey-policy-engine.js";
import {
  BatchedJourneyPolicyValidator,
  defaultBatchedJourneyPolicyValidator,
} from "./batched-journey-policy-rules.js";
import { BatchedJourneyPolicyStore } from "./batched-journey-policy-store.js";

/** Moves batched journey policies through their life cycle and keeps a journal of what it did. */
export class BatchedJourneyPolicyDesk {
  store: BatchedJourneyPolicyStore;
  validator: BatchedJourneyPolicyValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedJourneyPolicyEngine;

  constructor(
    store: BatchedJourneyPolicyStore,
    validator: BatchedJourneyPolicyValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedJourneyPolicyEngine,
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
      throw new Error(`batched journey policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched journey policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched journey policy ${code} not found`);
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

export function newBatchedJourneyPolicyDesk(store: BatchedJourneyPolicyStore, clockValue: clock.Clock): BatchedJourneyPolicyDesk {
  return new BatchedJourneyPolicyDesk(
    store,
    defaultBatchedJourneyPolicyValidator(),
    clockValue,
    [],
    defaultBatchedJourneyPolicyEngine(),
  );
}
