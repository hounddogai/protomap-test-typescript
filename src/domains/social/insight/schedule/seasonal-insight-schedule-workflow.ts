import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalInsightScheduleEngine,
  defaultSeasonalInsightScheduleEngine,
} from "./seasonal-insight-schedule-engine.js";
import {
  SeasonalInsightScheduleValidator,
  defaultSeasonalInsightScheduleValidator,
} from "./seasonal-insight-schedule-rules.js";
import { SeasonalInsightScheduleStore } from "./seasonal-insight-schedule-store.js";

/** Moves seasonal insight schedules through their life cycle and keeps a journal of what it did. */
export class SeasonalInsightScheduleWorkflow {
  store: SeasonalInsightScheduleStore;
  validator: SeasonalInsightScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalInsightScheduleEngine;

  constructor(
    store: SeasonalInsightScheduleStore,
    validator: SeasonalInsightScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalInsightScheduleEngine,
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
      throw new Error(`seasonal insight schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal insight schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal insight schedule ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newSeasonalInsightScheduleWorkflow(store: SeasonalInsightScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalInsightScheduleWorkflow {
  return new SeasonalInsightScheduleWorkflow(
    store,
    defaultSeasonalInsightScheduleValidator(),
    clockValue,
    [],
    defaultSeasonalInsightScheduleEngine(flagsValue),
  );
}
