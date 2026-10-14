import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalDoubleOptInSlotEngine,
  defaultSeasonalDoubleOptInSlotEngine,
} from "./seasonal-double-opt-in-slot-engine.js";
import {
  SeasonalDoubleOptInSlotValidator,
  defaultSeasonalDoubleOptInSlotValidator,
} from "./seasonal-double-opt-in-slot-rules.js";
import { SeasonalDoubleOptInSlotStore } from "./seasonal-double-opt-in-slot-store.js";

/** Moves seasonal double opt in slots through their life cycle and keeps a journal of what it did. */
export class SeasonalDoubleOptInSlotCoordinator {
  store: SeasonalDoubleOptInSlotStore;
  validator: SeasonalDoubleOptInSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalDoubleOptInSlotEngine;

  constructor(
    store: SeasonalDoubleOptInSlotStore,
    validator: SeasonalDoubleOptInSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalDoubleOptInSlotEngine,
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
      throw new Error(`seasonal double opt in slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal double opt in slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal double opt in slot ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalDoubleOptInSlotCoordinator(store: SeasonalDoubleOptInSlotStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalDoubleOptInSlotCoordinator {
  return new SeasonalDoubleOptInSlotCoordinator(
    store,
    defaultSeasonalDoubleOptInSlotValidator(),
    clockValue,
    [],
    defaultSeasonalDoubleOptInSlotEngine(flagsValue),
  );
}
