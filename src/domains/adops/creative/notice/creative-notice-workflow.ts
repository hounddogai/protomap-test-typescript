import * as clock from "../../../../kit/clock.js";
import { CreativeNoticeEngine, defaultCreativeNoticeEngine } from "./creative-notice-engine.js";
import { CreativeNoticeValidator, defaultCreativeNoticeValidator } from "./creative-notice-rules.js";
import { CreativeNoticeStore } from "./creative-notice-store.js";

/** Moves creative notices through their life cycle and keeps a journal of what it did. */
export class CreativeNoticeManager {
  store: CreativeNoticeStore;
  validator: CreativeNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreativeNoticeEngine;

  constructor(
    store: CreativeNoticeStore,
    validator: CreativeNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreativeNoticeEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`creative notice ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newCreativeNoticeManager(store: CreativeNoticeStore, clockValue: clock.Clock): CreativeNoticeManager {
  return new CreativeNoticeManager(
    store,
    defaultCreativeNoticeValidator(),
    clockValue,
    [],
    defaultCreativeNoticeEngine(),
  );
}
