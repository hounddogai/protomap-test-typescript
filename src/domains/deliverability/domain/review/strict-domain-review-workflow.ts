import * as clock from "../../../../kit/clock.js";
import { StrictDomainReviewValidator, defaultStrictDomainReviewValidator } from "./strict-domain-review-rules.js";
import { StrictDomainReviewStore } from "./strict-domain-review-store.js";

/** Moves strict domain reviews through their life cycle and keeps a journal of what it did. */
export class StrictDomainReviewManager {
  store: StrictDomainReviewStore;
  validator: StrictDomainReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictDomainReviewStore,
    validator: StrictDomainReviewValidator,
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
      throw new Error(`strict domain review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict domain review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newStrictDomainReviewManager(store: StrictDomainReviewStore, clockValue: clock.Clock): StrictDomainReviewManager {
  return new StrictDomainReviewManager(store, defaultStrictDomainReviewValidator(), clockValue, []);
}
