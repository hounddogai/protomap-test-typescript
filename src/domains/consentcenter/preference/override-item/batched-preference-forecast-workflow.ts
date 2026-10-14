import * as clock from "../../../../kit/clock.js";
import {
  BatchedPreferenceForecastValidator,
  defaultBatchedPreferenceForecastValidator,
} from "./batched-preference-forecast-rules.js";
import { BatchedPreferenceForecastStore } from "./batched-preference-forecast-store.js";

/** Moves batched preference forecasts through their life cycle and keeps a journal of what it did. */
export class BatchedPreferenceForecastDesk {
  store: BatchedPreferenceForecastStore;
  validator: BatchedPreferenceForecastValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedPreferenceForecastStore,
    validator: BatchedPreferenceForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched preference forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched preference forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newBatchedPreferenceForecastDesk(store: BatchedPreferenceForecastStore, clockValue: clock.Clock): BatchedPreferenceForecastDesk {
  return new BatchedPreferenceForecastDesk(store, defaultBatchedPreferenceForecastValidator(), clockValue, []);
}
