import * as clock from "../../../../kit/clock.js";
import { WeightedFrequencySlotEngine, defaultWeightedFrequencySlotEngine } from "./weighted-frequency-slot-engine.js";
import {
  WeightedFrequencySlotValidator,
  defaultWeightedFrequencySlotValidator,
} from "./weighted-frequency-slot-rules.js";
import { WeightedFrequencySlotStore } from "./weighted-frequency-slot-store.js";

/** Moves weighted frequency slots through their life cycle and keeps a journal of what it did. */
export class WeightedFrequencySlotManager {
  store: WeightedFrequencySlotStore;
  validator: WeightedFrequencySlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedFrequencySlotEngine;

  constructor(
    store: WeightedFrequencySlotStore,
    validator: WeightedFrequencySlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedFrequencySlotEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted frequency slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted frequency slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted frequency slot ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newWeightedFrequencySlotManager(store: WeightedFrequencySlotStore, clockValue: clock.Clock): WeightedFrequencySlotManager {
  return new WeightedFrequencySlotManager(
    store,
    defaultWeightedFrequencySlotValidator(),
    clockValue,
    [],
    defaultWeightedFrequencySlotEngine(),
  );
}
