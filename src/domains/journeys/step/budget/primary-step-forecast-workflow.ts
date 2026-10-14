import * as clock from "../../../../kit/clock.js";
import { PrimaryStepForecastEngine, defaultPrimaryStepForecastEngine } from "./primary-step-forecast-engine.js";
import { PrimaryStepForecastValidator, defaultPrimaryStepForecastValidator } from "./primary-step-forecast-rules.js";
import { PrimaryStepForecastStore } from "./primary-step-forecast-store.js";

/** Moves primary step forecasts through their life cycle and keeps a journal of what it did. */
export class PrimaryStepForecastService {
  store: PrimaryStepForecastStore;
  validator: PrimaryStepForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryStepForecastEngine;

  constructor(
    store: PrimaryStepForecastStore,
    validator: PrimaryStepForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryStepForecastEngine,
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
      throw new Error(`primary step forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary step forecast ${code} not found`);
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
      throw new Error(`primary step forecast ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPrimaryStepForecastService(store: PrimaryStepForecastStore, clockValue: clock.Clock): PrimaryStepForecastService {
  return new PrimaryStepForecastService(
    store,
    defaultPrimaryStepForecastValidator(),
    clockValue,
    [],
    defaultPrimaryStepForecastEngine(),
  );
}
