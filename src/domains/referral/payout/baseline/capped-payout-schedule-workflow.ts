import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedPayoutScheduleEngine, defaultCappedPayoutScheduleEngine } from "./capped-payout-schedule-engine.js";
import {
  CappedPayoutScheduleValidator,
  defaultCappedPayoutScheduleValidator,
} from "./capped-payout-schedule-rules.js";
import { CappedPayoutScheduleStore } from "./capped-payout-schedule-store.js";

/** Moves capped payout schedules through their life cycle and keeps a journal of what it did. */
export class CappedPayoutScheduleCoordinator {
  store: CappedPayoutScheduleStore;
  validator: CappedPayoutScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedPayoutScheduleEngine;

  constructor(
    store: CappedPayoutScheduleStore,
    validator: CappedPayoutScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedPayoutScheduleEngine,
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
      throw new Error(`capped payout schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped payout schedule ${code} not found`);
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
      throw new Error(`capped payout schedule ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedPayoutScheduleCoordinator(store: CappedPayoutScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedPayoutScheduleCoordinator {
  return new CappedPayoutScheduleCoordinator(
    store,
    defaultCappedPayoutScheduleValidator(),
    clockValue,
    [],
    defaultCappedPayoutScheduleEngine(flagsValue),
  );
}
