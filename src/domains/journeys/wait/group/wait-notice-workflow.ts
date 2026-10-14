import * as clock from "../../../../kit/clock.js";
import { WaitNoticeEngine, defaultWaitNoticeEngine } from "./wait-notice-engine.js";
import { WaitNoticeValidator, defaultWaitNoticeValidator } from "./wait-notice-rules.js";
import { WaitNoticeStore } from "./wait-notice-store.js";

/** Moves wait notices through their life cycle and keeps a journal of what it did. */
export class WaitNoticeWorkflow {
  store: WaitNoticeStore;
  validator: WaitNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitNoticeEngine;

  constructor(
    store: WaitNoticeStore,
    validator: WaitNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitNoticeEngine,
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
      throw new Error(`wait notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait notice ${code} not found`);
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

export function newWaitNoticeWorkflow(store: WaitNoticeStore, clockValue: clock.Clock): WaitNoticeWorkflow {
  return new WaitNoticeWorkflow(store, defaultWaitNoticeValidator(), clockValue, [], defaultWaitNoticeEngine());
}
