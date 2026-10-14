import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  BatchedTicketViewBudgetEngine,
  defaultBatchedTicketViewBudgetEngine,
} from "./batched-ticket-view-budget-engine.js";
import {
  BatchedTicketViewBudgetValidator,
  defaultBatchedTicketViewBudgetValidator,
} from "./batched-ticket-view-budget-rules.js";
import { BatchedTicketViewBudgetStore } from "./batched-ticket-view-budget-store.js";

/** Moves batched ticket view budgets through their life cycle and keeps a journal of what it did. */
export class BatchedTicketViewBudgetService {
  store: BatchedTicketViewBudgetStore;
  validator: BatchedTicketViewBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedTicketViewBudgetEngine;

  constructor(
    store: BatchedTicketViewBudgetStore,
    validator: BatchedTicketViewBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedTicketViewBudgetEngine,
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
      throw new Error(`batched ticket view budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched ticket view budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched ticket view budget ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newBatchedTicketViewBudgetService(store: BatchedTicketViewBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): BatchedTicketViewBudgetService {
  return new BatchedTicketViewBudgetService(
    store,
    defaultBatchedTicketViewBudgetValidator(),
    clockValue,
    [],
    defaultBatchedTicketViewBudgetEngine(flagsValue),
  );
}
