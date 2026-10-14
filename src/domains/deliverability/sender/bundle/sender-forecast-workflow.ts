import * as clock from "../../../../kit/clock.js";
import { SenderForecastValidator, defaultSenderForecastValidator } from "./sender-forecast-rules.js";
import { SenderForecastStore } from "./sender-forecast-store.js";

/** Moves sender forecasts through their life cycle and keeps a journal of what it did. */
export class SenderForecastWorkflow {
  store: SenderForecastStore;
  validator: SenderForecastValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SenderForecastStore,
    validator: SenderForecastValidator,
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
      throw new Error(`sender forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newSenderForecastWorkflow(store: SenderForecastStore, clockValue: clock.Clock): SenderForecastWorkflow {
  return new SenderForecastWorkflow(store, defaultSenderForecastValidator(), clockValue, []);
}
