import * as clock from "../../../../kit/clock.js";
import {
  StrictSubscriptionBundleEngine,
  defaultStrictSubscriptionBundleEngine,
} from "./strict-subscription-bundle-engine.js";
import {
  StrictSubscriptionBundleValidator,
  defaultStrictSubscriptionBundleValidator,
} from "./strict-subscription-bundle-rules.js";
import { StrictSubscriptionBundleStore } from "./strict-subscription-bundle-store.js";

/** Moves strict subscription bundles through their life cycle and keeps a journal of what it did. */
export class StrictSubscriptionBundleService {
  store: StrictSubscriptionBundleStore;
  validator: StrictSubscriptionBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictSubscriptionBundleEngine;

  constructor(
    store: StrictSubscriptionBundleStore,
    validator: StrictSubscriptionBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictSubscriptionBundleEngine,
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
      throw new Error(`strict subscription bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict subscription bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict subscription bundle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictSubscriptionBundleService(store: StrictSubscriptionBundleStore, clockValue: clock.Clock): StrictSubscriptionBundleService {
  return new StrictSubscriptionBundleService(
    store,
    defaultStrictSubscriptionBundleValidator(),
    clockValue,
    [],
    defaultStrictSubscriptionBundleEngine(),
  );
}
