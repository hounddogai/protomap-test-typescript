import * as clock from "../../../../kit/clock.js";
import { ReplyRecordEngine, defaultReplyRecordEngine } from "./reply-record-engine.js";
import { ReplyRecordValidator, defaultReplyRecordValidator } from "./reply-record-rules.js";
import { ReplyRecordStore } from "./reply-record-store.js";

/** Moves reply records through their life cycle and keeps a journal of what it did. */
export class ReplyRecordService {
  store: ReplyRecordStore;
  validator: ReplyRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReplyRecordEngine;

  constructor(
    store: ReplyRecordStore,
    validator: ReplyRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReplyRecordEngine,
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
      throw new Error(`reply record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reply record ${code} not found`);
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
      throw new Error(`reply record ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newReplyRecordService(store: ReplyRecordStore, clockValue: clock.Clock): ReplyRecordService {
  return new ReplyRecordService(store, defaultReplyRecordValidator(), clockValue, [], defaultReplyRecordEngine());
}
