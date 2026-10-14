import * as clock from "../../../../kit/clock.js";
import { FallbackReplyNoticeEngine, defaultFallbackReplyNoticeEngine } from "./fallback-reply-notice-engine.js";
import { FallbackReplyNoticeValidator, defaultFallbackReplyNoticeValidator } from "./fallback-reply-notice-rules.js";
import { FallbackReplyNoticeStore } from "./fallback-reply-notice-store.js";

/** Moves fallback reply notices through their life cycle and keeps a journal of what it did. */
export class FallbackReplyNoticeService {
  store: FallbackReplyNoticeStore;
  validator: FallbackReplyNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackReplyNoticeEngine;

  constructor(
    store: FallbackReplyNoticeStore,
    validator: FallbackReplyNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackReplyNoticeEngine,
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
      throw new Error(`fallback reply notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback reply notice ${code} not found`);
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
      throw new Error(`fallback reply notice ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackReplyNoticeService(store: FallbackReplyNoticeStore, clockValue: clock.Clock): FallbackReplyNoticeService {
  return new FallbackReplyNoticeService(
    store,
    defaultFallbackReplyNoticeValidator(),
    clockValue,
    [],
    defaultFallbackReplyNoticeEngine(),
  );
}
