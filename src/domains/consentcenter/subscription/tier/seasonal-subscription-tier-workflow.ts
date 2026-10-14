import * as clock from "../../../../kit/clock.js";
import {
  SeasonalSubscriptionTierEngine,
  defaultSeasonalSubscriptionTierEngine,
} from "./seasonal-subscription-tier-engine.js";
import {
  SeasonalSubscriptionTierValidator,
  defaultSeasonalSubscriptionTierValidator,
} from "./seasonal-subscription-tier-rules.js";
import { SeasonalSubscriptionTierStore } from "./seasonal-subscription-tier-store.js";

/** Moves seasonal subscription tiers through their life cycle and keeps a journal of what it did. */
export class SeasonalSubscriptionTierManager {
  store: SeasonalSubscriptionTierStore;
  validator: SeasonalSubscriptionTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalSubscriptionTierEngine;

  constructor(
    store: SeasonalSubscriptionTierStore,
    validator: SeasonalSubscriptionTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalSubscriptionTierEngine,
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
      throw new Error(`seasonal subscription tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal subscription tier ${code} not found`);
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
      throw new Error(`seasonal subscription tier ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalSubscriptionTierManager(store: SeasonalSubscriptionTierStore, clockValue: clock.Clock): SeasonalSubscriptionTierManager {
  return new SeasonalSubscriptionTierManager(
    store,
    defaultSeasonalSubscriptionTierValidator(),
    clockValue,
    [],
    defaultSeasonalSubscriptionTierEngine(),
  );
}
