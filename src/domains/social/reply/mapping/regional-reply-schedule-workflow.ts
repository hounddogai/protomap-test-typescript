import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalReplyScheduleEngine, defaultRegionalReplyScheduleEngine } from "./regional-reply-schedule-engine.js";
import {
  RegionalReplyScheduleValidator,
  defaultRegionalReplyScheduleValidator,
} from "./regional-reply-schedule-rules.js";
import { RegionalReplyScheduleStore } from "./regional-reply-schedule-store.js";

/** Moves regional reply schedules through their life cycle and keeps a journal of what it did. */
export class RegionalReplyScheduleService {
  store: RegionalReplyScheduleStore;
  validator: RegionalReplyScheduleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalReplyScheduleEngine;

  constructor(
    store: RegionalReplyScheduleStore,
    validator: RegionalReplyScheduleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalReplyScheduleEngine,
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
      throw new Error(`regional reply schedule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional reply schedule ${code} not found`);
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
      throw new Error(`regional reply schedule ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newRegionalReplyScheduleService(store: RegionalReplyScheduleStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalReplyScheduleService {
  return new RegionalReplyScheduleService(
    store,
    defaultRegionalReplyScheduleValidator(),
    clockValue,
    [],
    defaultRegionalReplyScheduleEngine(flagsValue),
  );
}
