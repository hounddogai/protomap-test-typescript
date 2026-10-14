import * as clock from "../../../../kit/clock.js";
import { FrequencyThresholdEngine, defaultFrequencyThresholdEngine } from "./frequency-threshold-engine.js";
import { FrequencyThresholdValidator, defaultFrequencyThresholdValidator } from "./frequency-threshold-rules.js";
import { FrequencyThresholdStore } from "./frequency-threshold-store.js";

/** Moves frequency thresholds through their life cycle and keeps a journal of what it did. */
export class FrequencyThresholdDesk {
  store: FrequencyThresholdStore;
  validator: FrequencyThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FrequencyThresholdEngine;

  constructor(
    store: FrequencyThresholdStore,
    validator: FrequencyThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FrequencyThresholdEngine,
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
      throw new Error(`frequency threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency threshold ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFrequencyThresholdDesk(store: FrequencyThresholdStore, clockValue: clock.Clock): FrequencyThresholdDesk {
  return new FrequencyThresholdDesk(
    store,
    defaultFrequencyThresholdValidator(),
    clockValue,
    [],
    defaultFrequencyThresholdEngine(),
  );
}
