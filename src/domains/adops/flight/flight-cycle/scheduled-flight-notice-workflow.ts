import * as clock from "../../../../kit/clock.js";
import { ScheduledFlightNoticeEngine, defaultScheduledFlightNoticeEngine } from "./scheduled-flight-notice-engine.js";
import {
  ScheduledFlightNoticeValidator,
  defaultScheduledFlightNoticeValidator,
} from "./scheduled-flight-notice-rules.js";
import { ScheduledFlightNoticeStore } from "./scheduled-flight-notice-store.js";

/** Moves scheduled flight notices through their life cycle and keeps a journal of what it did. */
export class ScheduledFlightNoticeManager {
  store: ScheduledFlightNoticeStore;
  validator: ScheduledFlightNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFlightNoticeEngine;

  constructor(
    store: ScheduledFlightNoticeStore,
    validator: ScheduledFlightNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFlightNoticeEngine,
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
      throw new Error(`scheduled flight notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight notice ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newScheduledFlightNoticeManager(store: ScheduledFlightNoticeStore, clockValue: clock.Clock): ScheduledFlightNoticeManager {
  return new ScheduledFlightNoticeManager(
    store,
    defaultScheduledFlightNoticeValidator(),
    clockValue,
    [],
    defaultScheduledFlightNoticeEngine(),
  );
}
