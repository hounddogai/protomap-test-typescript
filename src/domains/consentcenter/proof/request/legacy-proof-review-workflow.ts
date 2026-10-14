import * as clock from "../../../../kit/clock.js";
import { LegacyProofReviewValidator, defaultLegacyProofReviewValidator } from "./legacy-proof-review-rules.js";
import { LegacyProofReviewStore } from "./legacy-proof-review-store.js";

/** Moves legacy proof reviews through their life cycle and keeps a journal of what it did. */
export class LegacyProofReviewDesk {
  store: LegacyProofReviewStore;
  validator: LegacyProofReviewValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyProofReviewStore,
    validator: LegacyProofReviewValidator,
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
      throw new Error(`legacy proof review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy proof review ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newLegacyProofReviewDesk(store: LegacyProofReviewStore, clockValue: clock.Clock): LegacyProofReviewDesk {
  return new LegacyProofReviewDesk(store, defaultLegacyProofReviewValidator(), clockValue, []);
}
