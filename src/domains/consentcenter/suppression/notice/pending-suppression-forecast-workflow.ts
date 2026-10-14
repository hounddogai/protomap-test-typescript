import * as clock from "../../../../kit/clock.js";
import {
  PendingSuppressionForecastEngine,
  defaultPendingSuppressionForecastEngine,
} from "./pending-suppression-forecast-engine.js";
import {
  PendingSuppressionForecastValidator,
  defaultPendingSuppressionForecastValidator,
} from "./pending-suppression-forecast-rules.js";
import { PendingSuppressionForecastStore } from "./pending-suppression-forecast-store.js";

/** Moves pending suppression forecasts through their life cycle and keeps a journal of what it did. */
export class PendingSuppressionForecastWorkflow {
  store: PendingSuppressionForecastStore;
  validator: PendingSuppressionForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingSuppressionForecastEngine;

  constructor(
    store: PendingSuppressionForecastStore,
    validator: PendingSuppressionForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingSuppressionForecastEngine,
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
      throw new Error(`pending suppression forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending suppression forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending suppression forecast ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newPendingSuppressionForecastWorkflow(store: PendingSuppressionForecastStore, clockValue: clock.Clock): PendingSuppressionForecastWorkflow {
  return new PendingSuppressionForecastWorkflow(
    store,
    defaultPendingSuppressionForecastValidator(),
    clockValue,
    [],
    defaultPendingSuppressionForecastEngine(),
  );
}
