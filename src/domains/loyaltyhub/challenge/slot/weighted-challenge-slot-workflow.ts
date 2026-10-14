import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WeightedChallengeSlotEngine, defaultWeightedChallengeSlotEngine } from "./weighted-challenge-slot-engine.js";
import {
  WeightedChallengeSlotValidator,
  defaultWeightedChallengeSlotValidator,
} from "./weighted-challenge-slot-rules.js";
import { WeightedChallengeSlotStore } from "./weighted-challenge-slot-store.js";

/** Moves weighted challenge slots through their life cycle and keeps a journal of what it did. */
export class WeightedChallengeSlotManager {
  store: WeightedChallengeSlotStore;
  validator: WeightedChallengeSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedChallengeSlotEngine;

  constructor(
    store: WeightedChallengeSlotStore,
    validator: WeightedChallengeSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedChallengeSlotEngine,
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
      throw new Error(`weighted challenge slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted challenge slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted challenge slot ${code} not found`);
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

export function newWeightedChallengeSlotManager(store: WeightedChallengeSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): WeightedChallengeSlotManager {
  return new WeightedChallengeSlotManager(
    store,
    defaultWeightedChallengeSlotValidator(),
    clockValue,
    [],
    defaultWeightedChallengeSlotEngine(flagsValue),
  );
}
