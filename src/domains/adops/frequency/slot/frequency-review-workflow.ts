import * as clock from "../../../../kit/clock.js";
import { FrequencyReviewValidator, defaultFrequencyReviewValidator } from "./frequency-review-rules.js";
import { FrequencyReviewStore } from "./frequency-review-store.js";

/** Moves frequency reviews through their life cycle and keeps a journal of what it did. */
export class FrequencyReviewManager {
  store: FrequencyReviewStore;
  validator: FrequencyReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FrequencyReviewStore,
    validator: FrequencyReviewValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency review ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFrequencyReviewManager(store: FrequencyReviewStore, clockValue: clock.Clock): FrequencyReviewManager {
  return new FrequencyReviewManager(store, defaultFrequencyReviewValidator(), clockValue, []);
}
