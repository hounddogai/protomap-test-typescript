import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SeasonalLevelOverrideEngine, defaultSeasonalLevelOverrideEngine } from "./seasonal-level-override-engine.js";
import {
  SeasonalLevelOverrideValidator,
  defaultSeasonalLevelOverrideValidator,
} from "./seasonal-level-override-rules.js";
import { SeasonalLevelOverrideStore } from "./seasonal-level-override-store.js";

/** Moves seasonal level overrides through their life cycle and keeps a journal of what it did. */
export class SeasonalLevelOverrideDesk {
  store: SeasonalLevelOverrideStore;
  validator: SeasonalLevelOverrideValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalLevelOverrideEngine;

  constructor(
    store: SeasonalLevelOverrideStore,
    validator: SeasonalLevelOverrideValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalLevelOverrideEngine,
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
      throw new Error(`seasonal level override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal level override ${code} not found`);
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
      throw new Error(`seasonal level override ${code} not found`);
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

export function newSeasonalLevelOverrideDesk(store: SeasonalLevelOverrideStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalLevelOverrideDesk {
  return new SeasonalLevelOverrideDesk(
    store,
    defaultSeasonalLevelOverrideValidator(),
    clockValue,
    [],
    defaultSeasonalLevelOverrideEngine(flagsValue),
  );
}
