import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ConversionForecastEngine, defaultConversionForecastEngine } from "./conversion-forecast-engine.js";
import { ConversionForecastValidator, defaultConversionForecastValidator } from "./conversion-forecast-rules.js";
import { ConversionForecastStore } from "./conversion-forecast-store.js";

/** Moves conversion forecasts through their life cycle and keeps a journal of what it did. */
export class ConversionForecastWorkflow {
  store: ConversionForecastStore;
  validator: ConversionForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ConversionForecastEngine;

  constructor(
    store: ConversionForecastStore,
    validator: ConversionForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ConversionForecastEngine,
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
      throw new Error(`conversion forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion forecast ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newConversionForecastWorkflow(store: ConversionForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): ConversionForecastWorkflow {
  return new ConversionForecastWorkflow(
    store,
    defaultConversionForecastValidator(),
    clockValue,
    [],
    defaultConversionForecastEngine(flagsValue),
  );
}
