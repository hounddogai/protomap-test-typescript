import * as clock from "../../../../kit/clock.js";
import {
  WeightedPacingScheduleEngine,
  defaultWeightedPacingScheduleEngine,
} from "./weighted-pacing-schedule-engine.js";
import {
  WeightedPacingScheduleValidator,
  defaultWeightedPacingScheduleValidator,
} from "./weighted-pacing-schedule-rules.js";
import { WeightedPacingScheduleStore } from "./weighted-pacing-schedule-store.js";

/** Moves weighted pacing schedules through their life cycle and keeps a journal of what it did. */
export class WeightedPacingScheduleWorkflow {
  store: WeightedPacingScheduleStore;
  validator: WeightedPacingScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WeightedPacingScheduleEngine;

  constructor(
    store: WeightedPacingScheduleStore,
    validator: WeightedPacingScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WeightedPacingScheduleEngine,
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
      throw new Error(`weighted pacing schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted pacing schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted pacing schedule ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newWeightedPacingScheduleWorkflow(store: WeightedPacingScheduleStore, clockValue: clock.Clock): WeightedPacingScheduleWorkflow {
  return new WeightedPacingScheduleWorkflow(
    store,
    defaultWeightedPacingScheduleValidator(),
    clockValue,
    [],
    defaultWeightedPacingScheduleEngine(),
  );
}
