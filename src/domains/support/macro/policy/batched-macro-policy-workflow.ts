import * as clock from "../../../../kit/clock.js";
import { BatchedMacroPolicyValidator, defaultBatchedMacroPolicyValidator } from "./batched-macro-policy-rules.js";
import { BatchedMacroPolicyStore } from "./batched-macro-policy-store.js";

/** Moves batched macro policies through their life cycle and keeps a journal of what it did. */
export class BatchedMacroPolicyWorkflow {
  store: BatchedMacroPolicyStore;
  validator: BatchedMacroPolicyValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedMacroPolicyStore,
    validator: BatchedMacroPolicyValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched macro policy ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched macro policy ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newBatchedMacroPolicyWorkflow(store: BatchedMacroPolicyStore, clockValue: clock.Clock): BatchedMacroPolicyWorkflow {
  return new BatchedMacroPolicyWorkflow(store, defaultBatchedMacroPolicyValidator(), clockValue, []);
}
