import * as clock from "../../../../kit/clock.js";
import {
  TieredConversionThresholdEngine,
  defaultTieredConversionThresholdEngine,
} from "./tiered-conversion-threshold-engine.js";
import {
  TieredConversionThresholdValidator,
  defaultTieredConversionThresholdValidator,
} from "./tiered-conversion-threshold-rules.js";
import { TieredConversionThresholdStore } from "./tiered-conversion-threshold-store.js";

/** Moves tiered conversion thresholds through their life cycle and keeps a journal of what it did. */
export class TieredConversionThresholdService {
  store: TieredConversionThresholdStore;
  validator: TieredConversionThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredConversionThresholdEngine;

  constructor(
    store: TieredConversionThresholdStore,
    validator: TieredConversionThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredConversionThresholdEngine,
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
      throw new Error(`tiered conversion threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered conversion threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered conversion threshold ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newTieredConversionThresholdService(store: TieredConversionThresholdStore, clockValue: clock.Clock): TieredConversionThresholdService {
  return new TieredConversionThresholdService(
    store,
    defaultTieredConversionThresholdValidator(),
    clockValue,
    [],
    defaultTieredConversionThresholdEngine(),
  );
}
