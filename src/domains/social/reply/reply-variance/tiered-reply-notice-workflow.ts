import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredReplyNoticeEngine, defaultTieredReplyNoticeEngine } from "./tiered-reply-notice-engine.js";
import { TieredReplyNoticeValidator, defaultTieredReplyNoticeValidator } from "./tiered-reply-notice-rules.js";
import { TieredReplyNoticeStore } from "./tiered-reply-notice-store.js";

/** Moves tiered reply notices through their life cycle and keeps a journal of what it did. */
export class TieredReplyNoticeService {
  store: TieredReplyNoticeStore;
  validator: TieredReplyNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredReplyNoticeEngine;

  constructor(
    store: TieredReplyNoticeStore,
    validator: TieredReplyNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredReplyNoticeEngine,
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
      throw new Error(`tiered reply notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reply notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reply notice ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTieredReplyNoticeService(store: TieredReplyNoticeStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredReplyNoticeService {
  return new TieredReplyNoticeService(
    store,
    defaultTieredReplyNoticeValidator(),
    clockValue,
    [],
    defaultTieredReplyNoticeEngine(flagsValue),
  );
}
