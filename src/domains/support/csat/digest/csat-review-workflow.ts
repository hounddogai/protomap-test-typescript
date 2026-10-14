import * as clock from "../../../../kit/clock.js";
import { CsatReviewEngine, defaultCsatReviewEngine } from "./csat-review-engine.js";
import { CsatReviewValidator, defaultCsatReviewValidator } from "./csat-review-rules.js";
import { CsatReviewStore } from "./csat-review-store.js";

/** Moves csat reviews through their life cycle and keeps a journal of what it did. */
export class CsatReviewDesk {
  store: CsatReviewStore;
  validator: CsatReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatReviewEngine;

  constructor(
    store: CsatReviewStore,
    validator: CsatReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatReviewEngine,
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
      throw new Error(`csat review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat review ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newCsatReviewDesk(store: CsatReviewStore, clockValue: clock.Clock): CsatReviewDesk {
  return new CsatReviewDesk(store, defaultCsatReviewValidator(), clockValue, [], defaultCsatReviewEngine());
}
