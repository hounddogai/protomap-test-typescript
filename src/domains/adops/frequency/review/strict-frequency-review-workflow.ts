import * as clock from "../../../../kit/clock.js";
import {
  StrictFrequencyReviewValidator,
  defaultStrictFrequencyReviewValidator,
} from "./strict-frequency-review-rules.js";
import { StrictFrequencyReviewStore } from "./strict-frequency-review-store.js";

/** Moves strict frequency reviews through their life cycle and keeps a journal of what it did. */
export class StrictFrequencyReviewCoordinator {
  store: StrictFrequencyReviewStore;
  validator: StrictFrequencyReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictFrequencyReviewStore,
    validator: StrictFrequencyReviewValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict frequency review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict frequency review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictFrequencyReviewCoordinator(store: StrictFrequencyReviewStore, clockValue: clock.Clock): StrictFrequencyReviewCoordinator {
  return new StrictFrequencyReviewCoordinator(store, defaultStrictFrequencyReviewValidator(), clockValue, []);
}
