import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryCsatScheduleEngine, defaultPrimaryCsatScheduleEngine } from "./primary-csat-schedule-engine.js";
import { PrimaryCsatScheduleValidator, defaultPrimaryCsatScheduleValidator } from "./primary-csat-schedule-rules.js";
import { PrimaryCsatScheduleStore } from "./primary-csat-schedule-store.js";

/** Moves primary csat schedules through their life cycle and keeps a journal of what it did. */
export class PrimaryCsatScheduleCoordinator {
  store: PrimaryCsatScheduleStore;
  validator: PrimaryCsatScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryCsatScheduleEngine;

  constructor(
    store: PrimaryCsatScheduleStore,
    validator: PrimaryCsatScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryCsatScheduleEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary csat schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary csat schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary csat schedule ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryCsatScheduleCoordinator(store: PrimaryCsatScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryCsatScheduleCoordinator {
  return new PrimaryCsatScheduleCoordinator(
    store,
    defaultPrimaryCsatScheduleValidator(),
    clockValue,
    [],
    defaultPrimaryCsatScheduleEngine(flagsValue),
  );
}
