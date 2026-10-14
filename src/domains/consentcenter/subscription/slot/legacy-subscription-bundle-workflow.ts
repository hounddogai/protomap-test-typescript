import * as clock from "../../../../kit/clock.js";
import {
  LegacySubscriptionBundleEngine,
  defaultLegacySubscriptionBundleEngine,
} from "./legacy-subscription-bundle-engine.js";
import {
  LegacySubscriptionBundleValidator,
  defaultLegacySubscriptionBundleValidator,
} from "./legacy-subscription-bundle-rules.js";
import { LegacySubscriptionBundleStore } from "./legacy-subscription-bundle-store.js";

/** Moves legacy subscription bundles through their life cycle and keeps a journal of what it did. */
export class LegacySubscriptionBundleDesk {
  store: LegacySubscriptionBundleStore;
  validator: LegacySubscriptionBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacySubscriptionBundleEngine;

  constructor(
    store: LegacySubscriptionBundleStore,
    validator: LegacySubscriptionBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacySubscriptionBundleEngine,
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
      throw new Error(`legacy subscription bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy subscription bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy subscription bundle ${code} not found`);
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

export function newLegacySubscriptionBundleDesk(store: LegacySubscriptionBundleStore, clockValue: clock.Clock): LegacySubscriptionBundleDesk {
  return new LegacySubscriptionBundleDesk(
    store,
    defaultLegacySubscriptionBundleValidator(),
    clockValue,
    [],
    defaultLegacySubscriptionBundleEngine(),
  );
}
