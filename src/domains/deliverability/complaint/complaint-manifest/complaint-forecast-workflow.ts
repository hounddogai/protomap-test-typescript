import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ComplaintForecastEngine, defaultComplaintForecastEngine } from "./complaint-forecast-engine.js";
import { ComplaintForecastValidator, defaultComplaintForecastValidator } from "./complaint-forecast-rules.js";
import { ComplaintForecastStore } from "./complaint-forecast-store.js";

/** Moves complaint forecasts through their life cycle and keeps a journal of what it did. */
export class ComplaintForecastCoordinator {
  store: ComplaintForecastStore;
  validator: ComplaintForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ComplaintForecastEngine;

  constructor(
    store: ComplaintForecastStore,
    validator: ComplaintForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ComplaintForecastEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`complaint forecast ${code} not found`);
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
      throw new Error(`complaint forecast ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newComplaintForecastCoordinator(store: ComplaintForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): ComplaintForecastCoordinator {
  return new ComplaintForecastCoordinator(
    store,
    defaultComplaintForecastValidator(),
    clockValue,
    [],
    defaultComplaintForecastEngine(flagsValue),
  );
}
