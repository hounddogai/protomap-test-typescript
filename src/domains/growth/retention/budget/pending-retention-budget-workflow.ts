import * as clock from "../../../../kit/clock.js";
import {
  PendingRetentionBudgetValidator,
  defaultPendingRetentionBudgetValidator,
} from "./pending-retention-budget-rules.js";
import { PendingRetentionBudgetStore } from "./pending-retention-budget-store.js";

/** Moves pending retention budgets through their life cycle and keeps a journal of what it did. */
export class PendingRetentionBudgetWorkflow {
  store: PendingRetentionBudgetStore;
  validator: PendingRetentionBudgetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PendingRetentionBudgetStore,
    validator: PendingRetentionBudgetValidator,
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
      throw new Error(`pending retention budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending retention budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newPendingRetentionBudgetWorkflow(store: PendingRetentionBudgetStore, clockValue: clock.Clock): PendingRetentionBudgetWorkflow {
  return new PendingRetentionBudgetWorkflow(store, defaultPendingRetentionBudgetValidator(), clockValue, []);
}
