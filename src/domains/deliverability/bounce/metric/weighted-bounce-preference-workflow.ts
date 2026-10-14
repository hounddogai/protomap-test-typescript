import * as clock from "../../../../kit/clock.js";
import {
  WeightedBouncePreferenceEngine,
  defaultWeightedBouncePreferenceEngine,
} from "./weighted-bounce-preference-engine.js";
import {
  WeightedBouncePreferenceValidator,
  defaultWeightedBouncePreferenceValidator,
} from "./weighted-bounce-preference-rules.js";
import { WeightedBouncePreferenceStore } from "./weighted-bounce-preference-store.js";

/** Moves weighted bounce preferences through their life cycle and keeps a journal of what it did. */
export class WeightedBouncePreferenceDesk {
  store: WeightedBouncePreferenceStore;
  validator: WeightedBouncePreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedBouncePreferenceEngine;

  constructor(
    store: WeightedBouncePreferenceStore,
    validator: WeightedBouncePreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedBouncePreferenceEngine,
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
      throw new Error(`weighted bounce preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted bounce preference ${code} not found`);
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
      throw new Error(`weighted bounce preference ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newWeightedBouncePreferenceDesk(store: WeightedBouncePreferenceStore, clockValue: clock.Clock): WeightedBouncePreferenceDesk {
  return new WeightedBouncePreferenceDesk(
    store,
    defaultWeightedBouncePreferenceValidator(),
    clockValue,
    [],
    defaultWeightedBouncePreferenceEngine(),
  );
}
