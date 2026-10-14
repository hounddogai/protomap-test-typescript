import * as clock from "../../../../kit/clock.js";
import { BatchedFlightBudgetValidator, defaultBatchedFlightBudgetValidator } from "./batched-flight-budget-rules.js";
import { BatchedFlightBudgetStore } from "./batched-flight-budget-store.js";

/** Moves batched flight budgets through their life cycle and keeps a journal of what it did. */
export class BatchedFlightBudgetManager {
  store: BatchedFlightBudgetStore;
  validator: BatchedFlightBudgetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedFlightBudgetStore,
    validator: BatchedFlightBudgetValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched flight budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched flight budget ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedFlightBudgetManager(store: BatchedFlightBudgetStore, clockValue: clock.Clock): BatchedFlightBudgetManager {
  return new BatchedFlightBudgetManager(store, defaultBatchedFlightBudgetValidator(), clockValue, []);
}
