import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SenderNoticeEngine, defaultSenderNoticeEngine } from "./sender-notice-engine.js";
import { SenderNoticeValidator, defaultSenderNoticeValidator } from "./sender-notice-rules.js";
import { SenderNoticeStore } from "./sender-notice-store.js";

/** Moves sender notices through their life cycle and keeps a journal of what it did. */
export class SenderNoticeManager {
  store: SenderNoticeStore;
  validator: SenderNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SenderNoticeEngine;

  constructor(
    store: SenderNoticeStore,
    validator: SenderNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SenderNoticeEngine,
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
      throw new Error(`sender notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender notice ${code} not found`);
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
      throw new Error(`sender notice ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSenderNoticeManager(store: SenderNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): SenderNoticeManager {
  return new SenderNoticeManager(
    store,
    defaultSenderNoticeValidator(),
    clockValue,
    [],
    defaultSenderNoticeEngine(flagsValue),
  );
}
