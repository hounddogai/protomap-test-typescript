import * as clock from "../../../../kit/clock.js";
import { RegionalStepReviewValidator, defaultRegionalStepReviewValidator } from "./regional-step-review-rules.js";
import { RegionalStepReviewStore } from "./regional-step-review-store.js";

/** Moves regional step reviews through their life cycle and keeps a journal of what it did. */
export class RegionalStepReviewDesk {
  store: RegionalStepReviewStore;
  validator: RegionalStepReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalStepReviewStore,
    validator: RegionalStepReviewValidator,
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
      throw new Error(`regional step review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional step review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRegionalStepReviewDesk(store: RegionalStepReviewStore, clockValue: clock.Clock): RegionalStepReviewDesk {
  return new RegionalStepReviewDesk(store, defaultRegionalStepReviewValidator(), clockValue, []);
}
