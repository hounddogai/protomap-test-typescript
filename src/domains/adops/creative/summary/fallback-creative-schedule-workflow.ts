import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  FallbackCreativeScheduleEngine,
  defaultFallbackCreativeScheduleEngine,
} from "./fallback-creative-schedule-engine.js";
import {
  FallbackCreativeScheduleValidator,
  defaultFallbackCreativeScheduleValidator,
} from "./fallback-creative-schedule-rules.js";
import { FallbackCreativeScheduleStore } from "./fallback-creative-schedule-store.js";

/** Moves fallback creative schedules through their life cycle and keeps a journal of what it did. */
export class FallbackCreativeScheduleService {
  store: FallbackCreativeScheduleStore;
  validator: FallbackCreativeScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackCreativeScheduleEngine;

  constructor(
    store: FallbackCreativeScheduleStore,
    validator: FallbackCreativeScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackCreativeScheduleEngine,
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
      throw new Error(`fallback creative schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback creative schedule ${code} not found`);
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
      throw new Error(`fallback creative schedule ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newFallbackCreativeScheduleService(store: FallbackCreativeScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackCreativeScheduleService {
  return new FallbackCreativeScheduleService(
    store,
    defaultFallbackCreativeScheduleValidator(),
    clockValue,
    [],
    defaultFallbackCreativeScheduleEngine(flagsValue),
  );
}
