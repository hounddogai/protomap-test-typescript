import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ManualQueueScheduleEngine, defaultManualQueueScheduleEngine } from "./manual-queue-schedule-engine.js";
import { ManualQueueScheduleValidator, defaultManualQueueScheduleValidator } from "./manual-queue-schedule-rules.js";
import { ManualQueueScheduleStore } from "./manual-queue-schedule-store.js";

/** Moves manual queue schedules through their life cycle and keeps a journal of what it did. */
export class ManualQueueScheduleService {
  store: ManualQueueScheduleStore;
  validator: ManualQueueScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualQueueScheduleEngine;

  constructor(
    store: ManualQueueScheduleStore,
    validator: ManualQueueScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualQueueScheduleEngine,
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
      throw new Error(`manual queue schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual queue schedule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual queue schedule ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newManualQueueScheduleService(store: ManualQueueScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): ManualQueueScheduleService {
  return new ManualQueueScheduleService(
    store,
    defaultManualQueueScheduleValidator(),
    clockValue,
    [],
    defaultManualQueueScheduleEngine(flagsValue),
  );
}
