import * as clock from "../../../../kit/clock.js";
import {
  SeasonalWaitPreferenceEngine,
  defaultSeasonalWaitPreferenceEngine,
} from "./seasonal-wait-preference-engine.js";
import {
  SeasonalWaitPreferenceValidator,
  defaultSeasonalWaitPreferenceValidator,
} from "./seasonal-wait-preference-rules.js";
import { SeasonalWaitPreferenceStore } from "./seasonal-wait-preference-store.js";

/** Moves seasonal wait preferences through their life cycle and keeps a journal of what it did. */
export class SeasonalWaitPreferenceCoordinator {
  store: SeasonalWaitPreferenceStore;
  validator: SeasonalWaitPreferenceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalWaitPreferenceEngine;

  constructor(
    store: SeasonalWaitPreferenceStore,
    validator: SeasonalWaitPreferenceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalWaitPreferenceEngine,
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
      throw new Error(`seasonal wait preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal wait preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal wait preference ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newSeasonalWaitPreferenceCoordinator(store: SeasonalWaitPreferenceStore, clockValue: clock.Clock): SeasonalWaitPreferenceCoordinator {
  return new SeasonalWaitPreferenceCoordinator(
    store,
    defaultSeasonalWaitPreferenceValidator(),
    clockValue,
    [],
    defaultSeasonalWaitPreferenceEngine(),
  );
}
