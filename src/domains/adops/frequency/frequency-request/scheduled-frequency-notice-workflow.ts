import * as clock from "../../../../kit/clock.js";
import {
  ScheduledFrequencyNoticeEngine,
  defaultScheduledFrequencyNoticeEngine,
} from "./scheduled-frequency-notice-engine.js";
import {
  ScheduledFrequencyNoticeValidator,
  defaultScheduledFrequencyNoticeValidator,
} from "./scheduled-frequency-notice-rules.js";
import { ScheduledFrequencyNoticeStore } from "./scheduled-frequency-notice-store.js";

/** Moves scheduled frequency notices through their life cycle and keeps a journal of what it did. */
export class ScheduledFrequencyNoticeService {
  store: ScheduledFrequencyNoticeStore;
  validator: ScheduledFrequencyNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledFrequencyNoticeEngine;

  constructor(
    store: ScheduledFrequencyNoticeStore,
    validator: ScheduledFrequencyNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledFrequencyNoticeEngine,
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
      throw new Error(`scheduled frequency notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled frequency notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled frequency notice ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newScheduledFrequencyNoticeService(store: ScheduledFrequencyNoticeStore, clockValue: clock.Clock): ScheduledFrequencyNoticeService {
  return new ScheduledFrequencyNoticeService(
    store,
    defaultScheduledFrequencyNoticeValidator(),
    clockValue,
    [],
    defaultScheduledFrequencyNoticeEngine(),
  );
}
