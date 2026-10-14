import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { AdaptiveCsatThresholdEngine, defaultAdaptiveCsatThresholdEngine } from "./adaptive-csat-threshold-engine.js";
import {
  AdaptiveCsatThresholdValidator,
  defaultAdaptiveCsatThresholdValidator,
} from "./adaptive-csat-threshold-rules.js";
import { AdaptiveCsatThresholdStore } from "./adaptive-csat-threshold-store.js";

/** Moves adaptive csat thresholds through their life cycle and keeps a journal of what it did. */
export class AdaptiveCsatThresholdService {
  store: AdaptiveCsatThresholdStore;
  validator: AdaptiveCsatThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveCsatThresholdEngine;

  constructor(
    store: AdaptiveCsatThresholdStore,
    validator: AdaptiveCsatThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveCsatThresholdEngine,
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
      throw new Error(`adaptive csat threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive csat threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive csat threshold ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newAdaptiveCsatThresholdService(store: AdaptiveCsatThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveCsatThresholdService {
  return new AdaptiveCsatThresholdService(
    store,
    defaultAdaptiveCsatThresholdValidator(),
    clockValue,
    [],
    defaultAdaptiveCsatThresholdEngine(flagsValue),
  );
}
