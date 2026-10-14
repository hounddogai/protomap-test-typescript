import * as clock from "../../../../kit/clock.js";
import { GlobalNudgeForecastEngine, defaultGlobalNudgeForecastEngine } from "./global-nudge-forecast-engine.js";
import { GlobalNudgeForecastValidator, defaultGlobalNudgeForecastValidator } from "./global-nudge-forecast-rules.js";
import { GlobalNudgeForecastStore } from "./global-nudge-forecast-store.js";

/** Moves global nudge forecasts through their life cycle and keeps a journal of what it did. */
export class GlobalNudgeForecastCoordinator {
  store: GlobalNudgeForecastStore;
  validator: GlobalNudgeForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalNudgeForecastEngine;

  constructor(
    store: GlobalNudgeForecastStore,
    validator: GlobalNudgeForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalNudgeForecastEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global nudge forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global nudge forecast ${code} not found`);
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
      throw new Error(`global nudge forecast ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newGlobalNudgeForecastCoordinator(store: GlobalNudgeForecastStore, clockValue: clock.Clock): GlobalNudgeForecastCoordinator {
  return new GlobalNudgeForecastCoordinator(
    store,
    defaultGlobalNudgeForecastValidator(),
    clockValue,
    [],
    defaultGlobalNudgeForecastEngine(),
  );
}
