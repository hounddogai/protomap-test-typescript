import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ReplyNoticeEngine, defaultReplyNoticeEngine } from "./reply-notice-engine.js";
import { ReplyNoticeValidator, defaultReplyNoticeValidator } from "./reply-notice-rules.js";
import { ReplyNoticeStore } from "./reply-notice-store.js";

/** Moves reply notices through their life cycle and keeps a journal of what it did. */
export class ReplyNoticeWorkflow {
  store: ReplyNoticeStore;
  validator: ReplyNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyNoticeEngine;

  constructor(
    store: ReplyNoticeStore,
    validator: ReplyNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyNoticeEngine,
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
      throw new Error(`reply notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply notice ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newReplyNoticeWorkflow(store: ReplyNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): ReplyNoticeWorkflow {
  return new ReplyNoticeWorkflow(
    store,
    defaultReplyNoticeValidator(),
    clockValue,
    [],
    defaultReplyNoticeEngine(flagsValue),
  );
}
