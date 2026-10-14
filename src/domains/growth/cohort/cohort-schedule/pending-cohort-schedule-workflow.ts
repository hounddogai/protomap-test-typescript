import * as clock from "../../../../kit/clock.js";
import { PendingCohortScheduleEngine, defaultPendingCohortScheduleEngine } from "./pending-cohort-schedule-engine.js";
import {
  PendingCohortScheduleValidator,
  defaultPendingCohortScheduleValidator,
} from "./pending-cohort-schedule-rules.js";
import { PendingCohortScheduleStore } from "./pending-cohort-schedule-store.js";

/** Moves pending cohort schedules through their life cycle and keeps a journal of what it did. */
export class PendingCohortScheduleCoordinator {
  store: PendingCohortScheduleStore;
  validator: PendingCohortScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingCohortScheduleEngine;

  constructor(
    store: PendingCohortScheduleStore,
    validator: PendingCohortScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingCohortScheduleEngine,
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
      throw new Error(`pending cohort schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending cohort schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending cohort schedule ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingCohortScheduleCoordinator(store: PendingCohortScheduleStore, clockValue: clock.Clock): PendingCohortScheduleCoordinator {
  return new PendingCohortScheduleCoordinator(
    store,
    defaultPendingCohortScheduleValidator(),
    clockValue,
    [],
    defaultPendingCohortScheduleEngine(),
  );
}
