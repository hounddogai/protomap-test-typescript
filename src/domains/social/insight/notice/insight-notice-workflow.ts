import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InsightNoticeEngine, defaultInsightNoticeEngine } from "./insight-notice-engine.js";
import { InsightNoticeValidator, defaultInsightNoticeValidator } from "./insight-notice-rules.js";
import { InsightNoticeStore } from "./insight-notice-store.js";

/** Moves insight notices through their life cycle and keeps a journal of what it did. */
export class InsightNoticeService {
  store: InsightNoticeStore;
  validator: InsightNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightNoticeEngine;

  constructor(
    store: InsightNoticeStore,
    validator: InsightNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightNoticeEngine,
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
      throw new Error(`insight notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight notice ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newInsightNoticeService(store: InsightNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): InsightNoticeService {
  return new InsightNoticeService(
    store,
    defaultInsightNoticeValidator(),
    clockValue,
    [],
    defaultInsightNoticeEngine(flagsValue),
  );
}
