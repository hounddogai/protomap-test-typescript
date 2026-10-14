import * as clock from "../../../../kit/clock.js";
import { JourneyForecastValidator, defaultJourneyForecastValidator } from "./journey-forecast-rules.js";
import { JourneyForecastStore } from "./journey-forecast-store.js";

/** Moves journey forecasts through their life cycle and keeps a journal of what it did. */
export class JourneyForecastCoordinator {
  store: JourneyForecastStore;
  validator: JourneyForecastValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: JourneyForecastStore,
    validator: JourneyForecastValidator,
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
      throw new Error(`journey forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`journey forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newJourneyForecastCoordinator(store: JourneyForecastStore, clockValue: clock.Clock): JourneyForecastCoordinator {
  return new JourneyForecastCoordinator(store, defaultJourneyForecastValidator(), clockValue, []);
}
