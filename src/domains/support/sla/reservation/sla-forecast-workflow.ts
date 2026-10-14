import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SlaForecastEngine, defaultSlaForecastEngine } from "./sla-forecast-engine.js";
import { SlaForecastValidator, defaultSlaForecastValidator } from "./sla-forecast-rules.js";
import { SlaForecastStore } from "./sla-forecast-store.js";

/** Moves sla forecasts through their life cycle and keeps a journal of what it did. */
export class SlaForecastService {
  store: SlaForecastStore;
  validator: SlaForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaForecastEngine;

  constructor(
    store: SlaForecastStore,
    validator: SlaForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaForecastEngine,
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
      throw new Error(`sla forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla forecast ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newSlaForecastService(store: SlaForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): SlaForecastService {
  return new SlaForecastService(
    store,
    defaultSlaForecastValidator(),
    clockValue,
    [],
    defaultSlaForecastEngine(flagsValue),
  );
}
