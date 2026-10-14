import * as clock from "../../../../kit/clock.js";
import { AdaptiveStreakTierEngine, defaultAdaptiveStreakTierEngine } from "./adaptive-streak-tier-engine.js";
import { AdaptiveStreakTierValidator, defaultAdaptiveStreakTierValidator } from "./adaptive-streak-tier-rules.js";
import { AdaptiveStreakTierStore } from "./adaptive-streak-tier-store.js";

/** Moves adaptive streak tiers through their life cycle and keeps a journal of what it did. */
export class AdaptiveStreakTierManager {
  store: AdaptiveStreakTierStore;
  validator: AdaptiveStreakTierValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveStreakTierEngine;

  constructor(
    store: AdaptiveStreakTierStore,
    validator: AdaptiveStreakTierValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveStreakTierEngine,
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
      throw new Error(`adaptive streak tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive streak tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive streak tier ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newAdaptiveStreakTierManager(store: AdaptiveStreakTierStore, clockValue: clock.Clock): AdaptiveStreakTierManager {
  return new AdaptiveStreakTierManager(
    store,
    defaultAdaptiveStreakTierValidator(),
    clockValue,
    [],
    defaultAdaptiveStreakTierEngine(),
  );
}
