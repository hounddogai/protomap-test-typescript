import * as clock from "../../../../kit/clock.js";
import { NudgeNoticeEngine, defaultNudgeNoticeEngine } from "./nudge-notice-engine.js";
import { NudgeNoticeValidator, defaultNudgeNoticeValidator } from "./nudge-notice-rules.js";
import { NudgeNoticeStore } from "./nudge-notice-store.js";

/** Moves nudge notices through their life cycle and keeps a journal of what it did. */
export class NudgeNoticeWorkflow {
  store: NudgeNoticeStore;
  validator: NudgeNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeNoticeEngine;

  constructor(
    store: NudgeNoticeStore,
    validator: NudgeNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeNoticeEngine,
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
      throw new Error(`nudge notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge notice ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newNudgeNoticeWorkflow(store: NudgeNoticeStore, clockValue: clock.Clock): NudgeNoticeWorkflow {
  return new NudgeNoticeWorkflow(store, defaultNudgeNoticeValidator(), clockValue, [], defaultNudgeNoticeEngine());
}
