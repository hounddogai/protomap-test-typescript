import * as clock from "../../../../kit/clock.js";
import { CappedBadgeForecastValidator, defaultCappedBadgeForecastValidator } from "./capped-badge-forecast-rules.js";
import { CappedBadgeForecastStore } from "./capped-badge-forecast-store.js";

/** Moves capped badge forecasts through their life cycle and keeps a journal of what it did. */
export class CappedBadgeForecastService {
  store: CappedBadgeForecastStore;
  validator: CappedBadgeForecastValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedBadgeForecastStore,
    validator: CappedBadgeForecastValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped badge forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped badge forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedBadgeForecastService(store: CappedBadgeForecastStore, clockValue: clock.Clock): CappedBadgeForecastService {
  return new CappedBadgeForecastService(store, defaultCappedBadgeForecastValidator(), clockValue, []);
}
