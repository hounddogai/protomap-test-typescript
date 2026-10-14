import * as clock from "../../../../kit/clock.js";
import { SuppressionNoticeEngine, defaultSuppressionNoticeEngine } from "./suppression-notice-engine.js";
import { SuppressionNoticeValidator, defaultSuppressionNoticeValidator } from "./suppression-notice-rules.js";
import { SuppressionNoticeStore } from "./suppression-notice-store.js";

/** Moves suppression notices through their life cycle and keeps a journal of what it did. */
export class SuppressionNoticeManager {
  store: SuppressionNoticeStore;
  validator: SuppressionNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SuppressionNoticeEngine;

  constructor(
    store: SuppressionNoticeStore,
    validator: SuppressionNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SuppressionNoticeEngine,
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
      throw new Error(`suppression notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`suppression notice ${code} not found`);
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
      throw new Error(`suppression notice ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newSuppressionNoticeManager(store: SuppressionNoticeStore, clockValue: clock.Clock): SuppressionNoticeManager {
  return new SuppressionNoticeManager(
    store,
    defaultSuppressionNoticeValidator(),
    clockValue,
    [],
    defaultSuppressionNoticeEngine(),
  );
}
