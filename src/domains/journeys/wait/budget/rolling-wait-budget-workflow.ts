import * as clock from "../../../../kit/clock.js";
import { RollingWaitBudgetValidator, defaultRollingWaitBudgetValidator } from "./rolling-wait-budget-rules.js";
import { RollingWaitBudgetStore } from "./rolling-wait-budget-store.js";

/** Moves rolling wait budgets through their life cycle and keeps a journal of what it did. */
export class RollingWaitBudgetManager {
  store: RollingWaitBudgetStore;
  validator: RollingWaitBudgetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingWaitBudgetStore,
    validator: RollingWaitBudgetValidator,
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
      throw new Error(`rolling wait budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling wait budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newRollingWaitBudgetManager(store: RollingWaitBudgetStore, clockValue: clock.Clock): RollingWaitBudgetManager {
  return new RollingWaitBudgetManager(store, defaultRollingWaitBudgetValidator(), clockValue, []);
}
