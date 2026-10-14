import * as clock from "../../../../kit/clock.js";
import { RetentionNoticeEngine, defaultRetentionNoticeEngine } from "./retention-notice-engine.js";
import { RetentionNoticeValidator, defaultRetentionNoticeValidator } from "./retention-notice-rules.js";
import { RetentionNoticeStore } from "./retention-notice-store.js";

/** Moves retention notices through their life cycle and keeps a journal of what it did. */
export class RetentionNoticeService {
  store: RetentionNoticeStore;
  validator: RetentionNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionNoticeEngine;

  constructor(
    store: RetentionNoticeStore,
    validator: RetentionNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionNoticeEngine,
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
      throw new Error(`retention notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention notice ${code} not found`);
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
      throw new Error(`retention notice ${code} not found`);
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

export function newRetentionNoticeService(store: RetentionNoticeStore, clockValue: clock.Clock): RetentionNoticeService {
  return new RetentionNoticeService(
    store,
    defaultRetentionNoticeValidator(),
    clockValue,
    [],
    defaultRetentionNoticeEngine(),
  );
}
