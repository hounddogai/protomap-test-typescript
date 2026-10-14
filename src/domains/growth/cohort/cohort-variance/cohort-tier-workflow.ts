import * as clock from "../../../../kit/clock.js";
import { CohortTierValidator, defaultCohortTierValidator } from "./cohort-tier-rules.js";
import { CohortTierStore } from "./cohort-tier-store.js";

/** Moves cohort tiers through their life cycle and keeps a journal of what it did. */
export class CohortTierDesk {
  store: CohortTierStore;
  validator: CohortTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: CohortTierStore, validator: CohortTierValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`cohort tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort tier ${code} not found`);
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

export function newCohortTierDesk(store: CohortTierStore, clockValue: clock.Clock): CohortTierDesk {
  return new CohortTierDesk(store, defaultCohortTierValidator(), clockValue, []);
}
