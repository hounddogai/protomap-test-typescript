import * as clock from "../../../../kit/clock.js";
import { SubscriptionRequestEngine, defaultSubscriptionRequestEngine } from "./subscription-request-engine.js";
import { SubscriptionRequestValidator, defaultSubscriptionRequestValidator } from "./subscription-request-rules.js";
import { SubscriptionRequestStore } from "./subscription-request-store.js";

/** Moves subscription requests through their life cycle and keeps a journal of what it did. */
export class SubscriptionRequestDesk {
  store: SubscriptionRequestStore;
  validator: SubscriptionRequestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionRequestEngine;

  constructor(
    store: SubscriptionRequestStore,
    validator: SubscriptionRequestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionRequestEngine,
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
      throw new Error(`subscription request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription request ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSubscriptionRequestDesk(store: SubscriptionRequestStore, clockValue: clock.Clock): SubscriptionRequestDesk {
  return new SubscriptionRequestDesk(
    store,
    defaultSubscriptionRequestValidator(),
    clockValue,
    [],
    defaultSubscriptionRequestEngine(),
  );
}
