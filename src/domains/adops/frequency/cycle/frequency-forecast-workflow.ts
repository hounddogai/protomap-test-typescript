import * as clock from "../../../../kit/clock.js";
import { FrequencyForecastValidator, defaultFrequencyForecastValidator } from "./frequency-forecast-rules.js";
import { FrequencyForecastStore } from "./frequency-forecast-store.js";

/** Moves frequency forecasts through their life cycle and keeps a journal of what it did. */
export class FrequencyForecastWorkflow {
  store: FrequencyForecastStore;
  validator: FrequencyForecastValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FrequencyForecastStore,
    validator: FrequencyForecastValidator,
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
      throw new Error(`frequency forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newFrequencyForecastWorkflow(store: FrequencyForecastStore, clockValue: clock.Clock): FrequencyForecastWorkflow {
  return new FrequencyForecastWorkflow(store, defaultFrequencyForecastValidator(), clockValue, []);
}
