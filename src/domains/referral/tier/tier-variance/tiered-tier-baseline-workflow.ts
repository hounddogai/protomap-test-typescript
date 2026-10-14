import * as clock from "../../../../kit/clock.js";
import { TieredTierBaselineEngine, defaultTieredTierBaselineEngine } from "./tiered-tier-baseline-engine.js";
import { TieredTierBaselineValidator, defaultTieredTierBaselineValidator } from "./tiered-tier-baseline-rules.js";
import { TieredTierBaselineStore } from "./tiered-tier-baseline-store.js";

/** Moves tiered tier baselines through their life cycle and keeps a journal of what it did. */
export class TieredTierBaselineCoordinator {
  store: TieredTierBaselineStore;
  validator: TieredTierBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredTierBaselineEngine;

  constructor(
    store: TieredTierBaselineStore,
    validator: TieredTierBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredTierBaselineEngine,
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
      throw new Error(`tiered tier baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered tier baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered tier baseline ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newTieredTierBaselineCoordinator(store: TieredTierBaselineStore, clockValue: clock.Clock): TieredTierBaselineCoordinator {
  return new TieredTierBaselineCoordinator(
    store,
    defaultTieredTierBaselineValidator(),
    clockValue,
    [],
    defaultTieredTierBaselineEngine(),
  );
}
