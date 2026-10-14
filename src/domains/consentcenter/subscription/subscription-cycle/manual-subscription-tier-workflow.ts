import * as clock from "../../../../kit/clock.js";
import {
  ManualSubscriptionTierEngine,
  defaultManualSubscriptionTierEngine,
} from "./manual-subscription-tier-engine.js";
import {
  ManualSubscriptionTierValidator,
  defaultManualSubscriptionTierValidator,
} from "./manual-subscription-tier-rules.js";
import { ManualSubscriptionTierStore } from "./manual-subscription-tier-store.js";

/** Moves manual subscription tiers through their life cycle and keeps a journal of what it did. */
export class ManualSubscriptionTierDesk {
  store: ManualSubscriptionTierStore;
  validator: ManualSubscriptionTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualSubscriptionTierEngine;

  constructor(
    store: ManualSubscriptionTierStore,
    validator: ManualSubscriptionTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualSubscriptionTierEngine,
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
      throw new Error(`manual subscription tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual subscription tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual subscription tier ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualSubscriptionTierDesk(store: ManualSubscriptionTierStore, clockValue: clock.Clock): ManualSubscriptionTierDesk {
  return new ManualSubscriptionTierDesk(
    store,
    defaultManualSubscriptionTierValidator(),
    clockValue,
    [],
    defaultManualSubscriptionTierEngine(),
  );
}
