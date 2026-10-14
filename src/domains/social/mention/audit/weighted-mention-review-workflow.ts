import * as clock from "../../../../kit/clock.js";
import {
  WeightedMentionReviewValidator,
  defaultWeightedMentionReviewValidator,
} from "./weighted-mention-review-rules.js";
import { WeightedMentionReviewStore } from "./weighted-mention-review-store.js";

/** Moves weighted mention reviews through their life cycle and keeps a journal of what it did. */
export class WeightedMentionReviewService {
  store: WeightedMentionReviewStore;
  validator: WeightedMentionReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedMentionReviewStore,
    validator: WeightedMentionReviewValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted mention review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedMentionReviewService(store: WeightedMentionReviewStore, clockValue: clock.Clock): WeightedMentionReviewService {
  return new WeightedMentionReviewService(store, defaultWeightedMentionReviewValidator(), clockValue, []);
}
