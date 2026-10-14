import * as clock from "../../../../kit/clock.js";
import { SubscriptionBundleEngine, defaultSubscriptionBundleEngine } from "./subscription-bundle-engine.js";
import { SubscriptionBundleValidator, defaultSubscriptionBundleValidator } from "./subscription-bundle-rules.js";
import { SubscriptionBundleStore } from "./subscription-bundle-store.js";

/** Moves subscription bundles through their life cycle and keeps a journal of what it did. */
export class SubscriptionBundleDesk {
  store: SubscriptionBundleStore;
  validator: SubscriptionBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SubscriptionBundleEngine;

  constructor(
    store: SubscriptionBundleStore,
    validator: SubscriptionBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SubscriptionBundleEngine,
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
      throw new Error(`subscription bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`subscription bundle ${code} not found`);
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

export function newSubscriptionBundleDesk(store: SubscriptionBundleStore, clockValue: clock.Clock): SubscriptionBundleDesk {
  return new SubscriptionBundleDesk(
    store,
    defaultSubscriptionBundleValidator(),
    clockValue,
    [],
    defaultSubscriptionBundleEngine(),
  );
}
