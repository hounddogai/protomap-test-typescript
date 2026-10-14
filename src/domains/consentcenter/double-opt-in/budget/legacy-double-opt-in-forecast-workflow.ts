import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyDoubleOptInForecastEngine,
  defaultLegacyDoubleOptInForecastEngine,
} from "./legacy-double-opt-in-forecast-engine.js";
import {
  LegacyDoubleOptInForecastValidator,
  defaultLegacyDoubleOptInForecastValidator,
} from "./legacy-double-opt-in-forecast-rules.js";
import { LegacyDoubleOptInForecastStore } from "./legacy-double-opt-in-forecast-store.js";

/** Moves legacy double opt in forecasts through their life cycle and keeps a journal of what it did. */
export class LegacyDoubleOptInForecastDesk {
  store: LegacyDoubleOptInForecastStore;
  validator: LegacyDoubleOptInForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyDoubleOptInForecastEngine;

  constructor(
    store: LegacyDoubleOptInForecastStore,
    validator: LegacyDoubleOptInForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyDoubleOptInForecastEngine,
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
      throw new Error(`legacy double opt in forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy double opt in forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy double opt in forecast ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newLegacyDoubleOptInForecastDesk(store: LegacyDoubleOptInForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyDoubleOptInForecastDesk {
  return new LegacyDoubleOptInForecastDesk(
    store,
    defaultLegacyDoubleOptInForecastValidator(),
    clockValue,
    [],
    defaultLegacyDoubleOptInForecastEngine(flagsValue),
  );
}
