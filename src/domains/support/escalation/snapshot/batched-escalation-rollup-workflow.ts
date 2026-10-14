import * as clock from "../../../../kit/clock.js";
import {
  BatchedEscalationRollupValidator,
  defaultBatchedEscalationRollupValidator,
} from "./batched-escalation-rollup-rules.js";
import { BatchedEscalationRollupStore } from "./batched-escalation-rollup-store.js";

/** Moves batched escalation rollups through their life cycle and keeps a journal of what it did. */
export class BatchedEscalationRollupDesk {
  store: BatchedEscalationRollupStore;
  validator: BatchedEscalationRollupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedEscalationRollupStore,
    validator: BatchedEscalationRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched escalation rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched escalation rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newBatchedEscalationRollupDesk(store: BatchedEscalationRollupStore, clockValue: clock.Clock): BatchedEscalationRollupDesk {
  return new BatchedEscalationRollupDesk(store, defaultBatchedEscalationRollupValidator(), clockValue, []);
}
