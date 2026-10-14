import * as clock from "../../../../kit/clock.js";
import {
  SeasonalRewardBudgetValidator,
  defaultSeasonalRewardBudgetValidator,
} from "./seasonal-reward-budget-rules.js";
import { SeasonalRewardBudgetStore } from "./seasonal-reward-budget-store.js";

/** Moves seasonal reward budgets through their life cycle and keeps a journal of what it did. */
export class SeasonalRewardBudgetManager {
  store: SeasonalRewardBudgetStore;
  validator: SeasonalRewardBudgetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalRewardBudgetStore,
    validator: SeasonalRewardBudgetValidator,
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
      throw new Error(`seasonal reward budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal reward budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newSeasonalRewardBudgetManager(store: SeasonalRewardBudgetStore, clockValue: clock.Clock): SeasonalRewardBudgetManager {
  return new SeasonalRewardBudgetManager(store, defaultSeasonalRewardBudgetValidator(), clockValue, []);
}
