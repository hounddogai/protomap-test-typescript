import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SubscriptionVarianceEngine, defaultSubscriptionVarianceEngine } from "./subscription-variance-engine.js";
import {
  SubscriptionVarianceValidator,
  defaultSubscriptionVarianceValidator,
} from "./subscription-variance-rules.js";
import { SubscriptionVarianceStore } from "./subscription-variance-store.js";

/** Moves subscription variances through their life cycle and keeps a journal of what it did. */
export class SubscriptionVarianceDesk {
  store: SubscriptionVarianceStore;
  validator: SubscriptionVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionVarianceEngine;

  constructor(
    store: SubscriptionVarianceStore,
    validator: SubscriptionVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionVarianceEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription variance ${code} not found`);
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
      throw new Error(`subscription variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newSubscriptionVarianceDesk(store: SubscriptionVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): SubscriptionVarianceDesk {
  return new SubscriptionVarianceDesk(
    store,
    defaultSubscriptionVarianceValidator(),
    clockValue,
    [],
    defaultSubscriptionVarianceEngine(flagsValue),
  );
}
