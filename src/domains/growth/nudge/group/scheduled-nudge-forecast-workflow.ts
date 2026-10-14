import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  ScheduledNudgeForecastEngine,
  defaultScheduledNudgeForecastEngine,
} from "./scheduled-nudge-forecast-engine.js";
import {
  ScheduledNudgeForecastValidator,
  defaultScheduledNudgeForecastValidator,
} from "./scheduled-nudge-forecast-rules.js";
import { ScheduledNudgeForecastStore } from "./scheduled-nudge-forecast-store.js";

/** Moves scheduled nudge forecasts through their life cycle and keeps a journal of what it did. */
export class ScheduledNudgeForecastWorkflow {
  store: ScheduledNudgeForecastStore;
  validator: ScheduledNudgeForecastValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledNudgeForecastEngine;

  constructor(
    store: ScheduledNudgeForecastStore,
    validator: ScheduledNudgeForecastValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledNudgeForecastEngine,
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
      throw new Error(`scheduled nudge forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled nudge forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled nudge forecast ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newScheduledNudgeForecastWorkflow(store: ScheduledNudgeForecastStore, clockValue: clock.Clock, flagsValue: flags.Registry): ScheduledNudgeForecastWorkflow {
  return new ScheduledNudgeForecastWorkflow(
    store,
    defaultScheduledNudgeForecastValidator(),
    clockValue,
    [],
    defaultScheduledNudgeForecastEngine(flagsValue),
  );
}
