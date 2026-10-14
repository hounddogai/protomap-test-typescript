import * as clock from "../../../../kit/clock.js";
import { SubscriptionPlanEngine, defaultSubscriptionPlanEngine } from "./subscription-plan-engine.js";
import { SubscriptionPlanValidator, defaultSubscriptionPlanValidator } from "./subscription-plan-rules.js";
import { SubscriptionPlanStore } from "./subscription-plan-store.js";

/** Moves subscription plans through their life cycle and keeps a journal of what it did. */
export class SubscriptionPlanManager {
  store: SubscriptionPlanStore;
  validator: SubscriptionPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionPlanEngine;

  constructor(
    store: SubscriptionPlanStore,
    validator: SubscriptionPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionPlanEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription plan ${code} not found`);
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

export function newSubscriptionPlanManager(store: SubscriptionPlanStore, clockValue: clock.Clock): SubscriptionPlanManager {
  return new SubscriptionPlanManager(
    store,
    defaultSubscriptionPlanValidator(),
    clockValue,
    [],
    defaultSubscriptionPlanEngine(),
  );
}
