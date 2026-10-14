import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredModelVarianceEngine, defaultTieredModelVarianceEngine } from "./tiered-model-variance-engine.js";
import { TieredModelVarianceValidator, defaultTieredModelVarianceValidator } from "./tiered-model-variance-rules.js";
import { TieredModelVarianceStore } from "./tiered-model-variance-store.js";

/** Moves tiered model variances through their life cycle and keeps a journal of what it did. */
export class TieredModelVarianceManager {
  store: TieredModelVarianceStore;
  validator: TieredModelVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredModelVarianceEngine;

  constructor(
    store: TieredModelVarianceStore,
    validator: TieredModelVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredModelVarianceEngine,
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
      throw new Error(`tiered model variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered model variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered model variance ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTieredModelVarianceManager(store: TieredModelVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredModelVarianceManager {
  return new TieredModelVarianceManager(
    store,
    defaultTieredModelVarianceValidator(),
    clockValue,
    [],
    defaultTieredModelVarianceEngine(flagsValue),
  );
}
