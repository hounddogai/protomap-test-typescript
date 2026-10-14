import * as clock from "../../../../kit/clock.js";
import { ReputationNoticeEngine, defaultReputationNoticeEngine } from "./reputation-notice-engine.js";
import { ReputationNoticeValidator, defaultReputationNoticeValidator } from "./reputation-notice-rules.js";
import { ReputationNoticeStore } from "./reputation-notice-store.js";

/** Moves reputation notices through their life cycle and keeps a journal of what it did. */
export class ReputationNoticeDesk {
  store: ReputationNoticeStore;
  validator: ReputationNoticeValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationNoticeEngine;

  constructor(
    store: ReputationNoticeStore,
    validator: ReputationNoticeValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationNoticeEngine,
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
      throw new Error(`reputation notice ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation notice ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation notice ${code} not found`);
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

export function newReputationNoticeDesk(store: ReputationNoticeStore, clockValue: clock.Clock): ReputationNoticeDesk {
  return new ReputationNoticeDesk(
    store,
    defaultReputationNoticeValidator(),
    clockValue,
    [],
    defaultReputationNoticeEngine(),
  );
}
