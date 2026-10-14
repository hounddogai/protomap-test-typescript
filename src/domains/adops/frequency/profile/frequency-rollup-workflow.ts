import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FrequencyRollupEngine, defaultFrequencyRollupEngine } from "./frequency-rollup-engine.js";
import { FrequencyRollupValidator, defaultFrequencyRollupValidator } from "./frequency-rollup-rules.js";
import { FrequencyRollupStore } from "./frequency-rollup-store.js";

/** Moves frequency rollups through their life cycle and keeps a journal of what it did. */
export class FrequencyRollupManager {
  store: FrequencyRollupStore;
  validator: FrequencyRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FrequencyRollupEngine;

  constructor(
    store: FrequencyRollupStore,
    validator: FrequencyRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FrequencyRollupEngine,
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
      throw new Error(`frequency rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency rollup ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newFrequencyRollupManager(store: FrequencyRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): FrequencyRollupManager {
  return new FrequencyRollupManager(
    store,
    defaultFrequencyRollupValidator(),
    clockValue,
    [],
    defaultFrequencyRollupEngine(flagsValue),
  );
}
