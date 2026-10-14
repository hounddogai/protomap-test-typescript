import * as clock from "../../../../kit/clock.js";
import {
  RegionalChallengeReviewValidator,
  defaultRegionalChallengeReviewValidator,
} from "./regional-challenge-review-rules.js";
import { RegionalChallengeReviewStore } from "./regional-challenge-review-store.js";

/** Moves regional challenge reviews through their life cycle and keeps a journal of what it did. */
export class RegionalChallengeReviewCoordinator {
  store: RegionalChallengeReviewStore;
  validator: RegionalChallengeReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalChallengeReviewStore,
    validator: RegionalChallengeReviewValidator,
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
      throw new Error(`regional challenge review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional challenge review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRegionalChallengeReviewCoordinator(store: RegionalChallengeReviewStore, clockValue: clock.Clock): RegionalChallengeReviewCoordinator {
  return new RegionalChallengeReviewCoordinator(store, defaultRegionalChallengeReviewValidator(), clockValue, []);
}
