import * as clock from "../../../../kit/clock.js";
import { TierNoticeEngine, defaultTierNoticeEngine } from "./tier-notice-engine.js";
import { TierNoticeValidator, defaultTierNoticeValidator } from "./tier-notice-rules.js";
import { TierNoticeStore } from "./tier-notice-store.js";

/** Moves tier notices through their life cycle and keeps a journal of what it did. */
export class TierNoticeManager {
  store: TierNoticeStore;
  validator: TierNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TierNoticeEngine;

  constructor(
    store: TierNoticeStore,
    validator: TierNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TierNoticeEngine,
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
      throw new Error(`tier notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier notice ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newTierNoticeManager(store: TierNoticeStore, clockValue: clock.Clock): TierNoticeManager {
  return new TierNoticeManager(store, defaultTierNoticeValidator(), clockValue, [], defaultTierNoticeEngine());
}
