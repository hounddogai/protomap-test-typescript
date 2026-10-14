import * as clock from "../../../../kit/clock.js";
import {
  FallbackFrequencyThresholdEngine,
  defaultFallbackFrequencyThresholdEngine,
} from "./fallback-frequency-threshold-engine.js";
import {
  FallbackFrequencyThresholdValidator,
  defaultFallbackFrequencyThresholdValidator,
} from "./fallback-frequency-threshold-rules.js";
import { FallbackFrequencyThresholdStore } from "./fallback-frequency-threshold-store.js";

/** Moves fallback frequency thresholds through their life cycle and keeps a journal of what it did. */
export class FallbackFrequencyThresholdService {
  store: FallbackFrequencyThresholdStore;
  validator: FallbackFrequencyThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackFrequencyThresholdEngine;

  constructor(
    store: FallbackFrequencyThresholdStore,
    validator: FallbackFrequencyThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackFrequencyThresholdEngine,
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
      throw new Error(`fallback frequency threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback frequency threshold ${code} not found`);
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
      throw new Error(`fallback frequency threshold ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFallbackFrequencyThresholdService(store: FallbackFrequencyThresholdStore, clockValue: clock.Clock): FallbackFrequencyThresholdService {
  return new FallbackFrequencyThresholdService(
    store,
    defaultFallbackFrequencyThresholdValidator(),
    clockValue,
    [],
    defaultFallbackFrequencyThresholdEngine(),
  );
}
