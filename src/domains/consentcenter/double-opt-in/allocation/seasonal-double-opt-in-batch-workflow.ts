import * as clock from "../../../../kit/clock.js";
import {
  SeasonalDoubleOptInBatchEngine,
  defaultSeasonalDoubleOptInBatchEngine,
} from "./seasonal-double-opt-in-batch-engine.js";
import {
  SeasonalDoubleOptInBatchValidator,
  defaultSeasonalDoubleOptInBatchValidator,
} from "./seasonal-double-opt-in-batch-rules.js";
import { SeasonalDoubleOptInBatchStore } from "./seasonal-double-opt-in-batch-store.js";

/** Moves seasonal double opt in batches through their life cycle and keeps a journal of what it did. */
export class SeasonalDoubleOptInBatchManager {
  store: SeasonalDoubleOptInBatchStore;
  validator: SeasonalDoubleOptInBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalDoubleOptInBatchEngine;

  constructor(
    store: SeasonalDoubleOptInBatchStore,
    validator: SeasonalDoubleOptInBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalDoubleOptInBatchEngine,
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
      throw new Error(`seasonal double opt in batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal double opt in batch ${code} not found`);
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
      throw new Error(`seasonal double opt in batch ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalDoubleOptInBatchManager(store: SeasonalDoubleOptInBatchStore, clockValue: clock.Clock): SeasonalDoubleOptInBatchManager {
  return new SeasonalDoubleOptInBatchManager(
    store,
    defaultSeasonalDoubleOptInBatchValidator(),
    clockValue,
    [],
    defaultSeasonalDoubleOptInBatchEngine(),
  );
}
