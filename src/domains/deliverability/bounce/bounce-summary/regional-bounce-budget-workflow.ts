import * as clock from "../../../../kit/clock.js";
import {
  RegionalBounceBudgetValidator,
  defaultRegionalBounceBudgetValidator,
} from "./regional-bounce-budget-rules.js";
import { RegionalBounceBudgetStore } from "./regional-bounce-budget-store.js";

/** Moves regional bounce budgets through their life cycle and keeps a journal of what it did. */
export class RegionalBounceBudgetService {
  store: RegionalBounceBudgetStore;
  validator: RegionalBounceBudgetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalBounceBudgetStore,
    validator: RegionalBounceBudgetValidator,
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
      throw new Error(`regional bounce budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional bounce budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalBounceBudgetService(store: RegionalBounceBudgetStore, clockValue: clock.Clock): RegionalBounceBudgetService {
  return new RegionalBounceBudgetService(store, defaultRegionalBounceBudgetValidator(), clockValue, []);
}
