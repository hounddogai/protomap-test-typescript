import * as clock from "../../../../kit/clock.js";
import { NudgeReviewEngine, defaultNudgeReviewEngine } from "./nudge-review-engine.js";
import { NudgeReviewValidator, defaultNudgeReviewValidator } from "./nudge-review-rules.js";
import { NudgeReviewStore } from "./nudge-review-store.js";

/** Moves nudge reviews through their life cycle and keeps a journal of what it did. */
export class NudgeReviewService {
  store: NudgeReviewStore;
  validator: NudgeReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: NudgeReviewEngine;

  constructor(
    store: NudgeReviewStore,
    validator: NudgeReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: NudgeReviewEngine,
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
      throw new Error(`nudge review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`nudge review ${code} not found`);
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

export function newNudgeReviewService(store: NudgeReviewStore, clockValue: clock.Clock): NudgeReviewService {
  return new NudgeReviewService(store, defaultNudgeReviewValidator(), clockValue, [], defaultNudgeReviewEngine());
}
