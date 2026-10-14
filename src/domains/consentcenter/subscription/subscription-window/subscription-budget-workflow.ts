import * as clock from "../../../../kit/clock.js";
import { SubscriptionBudgetEngine, defaultSubscriptionBudgetEngine } from "./subscription-budget-engine.js";
import { SubscriptionBudgetValidator, defaultSubscriptionBudgetValidator } from "./subscription-budget-rules.js";
import { SubscriptionBudgetStore } from "./subscription-budget-store.js";

/** Moves subscription budgets through their life cycle and keeps a journal of what it did. */
export class SubscriptionBudgetManager {
  store: SubscriptionBudgetStore;
  validator: SubscriptionBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionBudgetEngine;

  constructor(
    store: SubscriptionBudgetStore,
    validator: SubscriptionBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionBudgetEngine,
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
      throw new Error(`subscription budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription budget ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSubscriptionBudgetManager(store: SubscriptionBudgetStore, clockValue: clock.Clock): SubscriptionBudgetManager {
  return new SubscriptionBudgetManager(
    store,
    defaultSubscriptionBudgetValidator(),
    clockValue,
    [],
    defaultSubscriptionBudgetEngine(),
  );
}
