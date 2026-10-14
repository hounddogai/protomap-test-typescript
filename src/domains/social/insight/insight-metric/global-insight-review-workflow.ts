import * as clock from "../../../../kit/clock.js";
import { GlobalInsightReviewValidator, defaultGlobalInsightReviewValidator } from "./global-insight-review-rules.js";
import { GlobalInsightReviewStore } from "./global-insight-review-store.js";

/** Moves global insight reviews through their life cycle and keeps a journal of what it did. */
export class GlobalInsightReviewDesk {
  store: GlobalInsightReviewStore;
  validator: GlobalInsightReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalInsightReviewStore,
    validator: GlobalInsightReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global insight review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global insight review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newGlobalInsightReviewDesk(store: GlobalInsightReviewStore, clockValue: clock.Clock): GlobalInsightReviewDesk {
  return new GlobalInsightReviewDesk(store, defaultGlobalInsightReviewValidator(), clockValue, []);
}
