import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyBadgeNoticeEngine, defaultLegacyBadgeNoticeEngine } from "./legacy-badge-notice-engine.js";
import { LegacyBadgeNoticeValidator, defaultLegacyBadgeNoticeValidator } from "./legacy-badge-notice-rules.js";
import { LegacyBadgeNoticeStore } from "./legacy-badge-notice-store.js";

/** Moves legacy badge notices through their life cycle and keeps a journal of what it did. */
export class LegacyBadgeNoticeWorkflow {
  store: LegacyBadgeNoticeStore;
  validator: LegacyBadgeNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyBadgeNoticeEngine;

  constructor(
    store: LegacyBadgeNoticeStore,
    validator: LegacyBadgeNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyBadgeNoticeEngine,
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
      throw new Error(`legacy badge notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy badge notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy badge notice ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyBadgeNoticeWorkflow(store: LegacyBadgeNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyBadgeNoticeWorkflow {
  return new LegacyBadgeNoticeWorkflow(
    store,
    defaultLegacyBadgeNoticeValidator(),
    clockValue,
    [],
    defaultLegacyBadgeNoticeEngine(flagsValue),
  );
}
