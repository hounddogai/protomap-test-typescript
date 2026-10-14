import * as clock from "../../../../kit/clock.js";
import { ScheduledWindowNoticeEngine, defaultScheduledWindowNoticeEngine } from "./scheduled-window-notice-engine.js";
import {
  ScheduledWindowNoticeValidator,
  defaultScheduledWindowNoticeValidator,
} from "./scheduled-window-notice-rules.js";
import { ScheduledWindowNoticeStore } from "./scheduled-window-notice-store.js";

/** Moves scheduled window notices through their life cycle and keeps a journal of what it did. */
export class ScheduledWindowNoticeManager {
  store: ScheduledWindowNoticeStore;
  validator: ScheduledWindowNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledWindowNoticeEngine;

  constructor(
    store: ScheduledWindowNoticeStore,
    validator: ScheduledWindowNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledWindowNoticeEngine,
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
      throw new Error(`scheduled window notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled window notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled window notice ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newScheduledWindowNoticeManager(store: ScheduledWindowNoticeStore, clockValue: clock.Clock): ScheduledWindowNoticeManager {
  return new ScheduledWindowNoticeManager(
    store,
    defaultScheduledWindowNoticeValidator(),
    clockValue,
    [],
    defaultScheduledWindowNoticeEngine(),
  );
}
