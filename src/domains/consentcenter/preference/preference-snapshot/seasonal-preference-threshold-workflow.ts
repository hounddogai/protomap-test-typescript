import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalPreferenceThresholdEngine,
  defaultSeasonalPreferenceThresholdEngine,
} from "./seasonal-preference-threshold-engine.js";
import {
  SeasonalPreferenceThresholdValidator,
  defaultSeasonalPreferenceThresholdValidator,
} from "./seasonal-preference-threshold-rules.js";
import { SeasonalPreferenceThresholdStore } from "./seasonal-preference-threshold-store.js";

/** Moves seasonal preference thresholds through their life cycle and keeps a journal of what it did. */
export class SeasonalPreferenceThresholdService {
  store: SeasonalPreferenceThresholdStore;
  validator: SeasonalPreferenceThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalPreferenceThresholdEngine;

  constructor(
    store: SeasonalPreferenceThresholdStore,
    validator: SeasonalPreferenceThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalPreferenceThresholdEngine,
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
      throw new Error(`seasonal preference threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal preference threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal preference threshold ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalPreferenceThresholdService(store: SeasonalPreferenceThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalPreferenceThresholdService {
  return new SeasonalPreferenceThresholdService(
    store,
    defaultSeasonalPreferenceThresholdValidator(),
    clockValue,
    [],
    defaultSeasonalPreferenceThresholdEngine(flagsValue),
  );
}
