import * as clock from "../../../../kit/clock.js";
import { WindowForecastValidator, defaultWindowForecastValidator } from "./window-forecast-rules.js";
import { WindowForecastStore } from "./window-forecast-store.js";

/** Moves window forecasts through their life cycle and keeps a journal of what it did. */
export class WindowForecastManager {
  store: WindowForecastStore;
  validator: WindowForecastValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WindowForecastStore,
    validator: WindowForecastValidator,
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
      throw new Error(`window forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newWindowForecastManager(store: WindowForecastStore, clockValue: clock.Clock): WindowForecastManager {
  return new WindowForecastManager(store, defaultWindowForecastValidator(), clockValue, []);
}
