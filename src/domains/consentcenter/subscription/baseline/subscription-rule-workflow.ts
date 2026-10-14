import * as clock from "../../../../kit/clock.js";
import { SubscriptionRuleEngine, defaultSubscriptionRuleEngine } from "./subscription-rule-engine.js";
import { SubscriptionRuleValidator, defaultSubscriptionRuleValidator } from "./subscription-rule-rules.js";
import { SubscriptionRuleStore } from "./subscription-rule-store.js";

/** Moves subscription rules through their life cycle and keeps a journal of what it did. */
export class SubscriptionRuleDesk {
  store: SubscriptionRuleStore;
  validator: SubscriptionRuleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionRuleEngine;

  constructor(
    store: SubscriptionRuleStore,
    validator: SubscriptionRuleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionRuleEngine,
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
      throw new Error(`subscription rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription rule ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSubscriptionRuleDesk(store: SubscriptionRuleStore, clockValue: clock.Clock): SubscriptionRuleDesk {
  return new SubscriptionRuleDesk(
    store,
    defaultSubscriptionRuleValidator(),
    clockValue,
    [],
    defaultSubscriptionRuleEngine(),
  );
}
