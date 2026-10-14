import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TierBudgetEngine, defaultTierBudgetEngine } from "./tier-budget-engine.js";
import { TierBudgetValidator, defaultTierBudgetValidator } from "./tier-budget-rules.js";
import { TierBudgetStore } from "./tier-budget-store.js";

/** Moves tier budgets through their life cycle and keeps a journal of what it did. */
export class TierBudgetDesk {
  store: TierBudgetStore;
  validator: TierBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TierBudgetEngine;

  constructor(
    store: TierBudgetStore,
    validator: TierBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TierBudgetEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier budget ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newTierBudgetDesk(store: TierBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): TierBudgetDesk {
  return new TierBudgetDesk(store, defaultTierBudgetValidator(), clockValue, [], defaultTierBudgetEngine(flagsValue));
}
