import * as clock from "../../../../kit/clock.js";
import {
  ScheduledExitRuleNoticeEngine,
  defaultScheduledExitRuleNoticeEngine,
} from "./scheduled-exit-rule-notice-engine.js";
import {
  ScheduledExitRuleNoticeValidator,
  defaultScheduledExitRuleNoticeValidator,
} from "./scheduled-exit-rule-notice-rules.js";
import { ScheduledExitRuleNoticeStore } from "./scheduled-exit-rule-notice-store.js";

/** Moves scheduled exit rule notices through their life cycle and keeps a journal of what it did. */
export class ScheduledExitRuleNoticeService {
  store: ScheduledExitRuleNoticeStore;
  validator: ScheduledExitRuleNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ScheduledExitRuleNoticeEngine;

  constructor(
    store: ScheduledExitRuleNoticeStore,
    validator: ScheduledExitRuleNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ScheduledExitRuleNoticeEngine,
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
      throw new Error(`scheduled exit rule notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled exit rule notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled exit rule notice ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newScheduledExitRuleNoticeService(store: ScheduledExitRuleNoticeStore, clockValue: clock.Clock): ScheduledExitRuleNoticeService {
  return new ScheduledExitRuleNoticeService(
    store,
    defaultScheduledExitRuleNoticeValidator(),
    clockValue,
    [],
    defaultScheduledExitRuleNoticeEngine(),
  );
}
