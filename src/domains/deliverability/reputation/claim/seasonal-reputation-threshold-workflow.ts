import * as clock from "../../../../kit/clock.js";
import {
  SeasonalReputationThresholdEngine,
  defaultSeasonalReputationThresholdEngine,
} from "./seasonal-reputation-threshold-engine.js";
import {
  SeasonalReputationThresholdValidator,
  defaultSeasonalReputationThresholdValidator,
} from "./seasonal-reputation-threshold-rules.js";
import { SeasonalReputationThresholdStore } from "./seasonal-reputation-threshold-store.js";

/** Moves seasonal reputation thresholds through their life cycle and keeps a journal of what it did. */
export class SeasonalReputationThresholdDesk {
  store: SeasonalReputationThresholdStore;
  validator: SeasonalReputationThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalReputationThresholdEngine;

  constructor(
    store: SeasonalReputationThresholdStore,
    validator: SeasonalReputationThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalReputationThresholdEngine,
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
      throw new Error(`seasonal reputation threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal reputation threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal reputation threshold ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newSeasonalReputationThresholdDesk(store: SeasonalReputationThresholdStore, clockValue: clock.Clock): SeasonalReputationThresholdDesk {
  return new SeasonalReputationThresholdDesk(
    store,
    defaultSeasonalReputationThresholdValidator(),
    clockValue,
    [],
    defaultSeasonalReputationThresholdEngine(),
  );
}
