import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalPlacementPreferenceEngine,
  defaultSeasonalPlacementPreferenceEngine,
} from "./seasonal-placement-preference-engine.js";
import {
  SeasonalPlacementPreferenceValidator,
  defaultSeasonalPlacementPreferenceValidator,
} from "./seasonal-placement-preference-rules.js";
import { SeasonalPlacementPreferenceStore } from "./seasonal-placement-preference-store.js";

/** Moves seasonal placement preferences through their life cycle and keeps a journal of what it did. */
export class SeasonalPlacementPreferenceManager {
  store: SeasonalPlacementPreferenceStore;
  validator: SeasonalPlacementPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalPlacementPreferenceEngine;

  constructor(
    store: SeasonalPlacementPreferenceStore,
    validator: SeasonalPlacementPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalPlacementPreferenceEngine,
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
      throw new Error(`seasonal placement preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal placement preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal placement preference ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newSeasonalPlacementPreferenceManager(store: SeasonalPlacementPreferenceStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalPlacementPreferenceManager {
  return new SeasonalPlacementPreferenceManager(
    store,
    defaultSeasonalPlacementPreferenceValidator(),
    clockValue,
    [],
    defaultSeasonalPlacementPreferenceEngine(flagsValue),
  );
}
