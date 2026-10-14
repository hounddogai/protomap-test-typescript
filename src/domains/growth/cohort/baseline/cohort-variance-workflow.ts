import * as clock from "../../../../kit/clock.js";
import { CohortVarianceValidator, defaultCohortVarianceValidator } from "./cohort-variance-rules.js";
import { CohortVarianceStore } from "./cohort-variance-store.js";

/** Moves cohort variances through their life cycle and keeps a journal of what it did. */
export class CohortVarianceDesk {
  store: CohortVarianceStore;
  validator: CohortVarianceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CohortVarianceStore,
    validator: CohortVarianceValidator,
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
      throw new Error(`cohort variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newCohortVarianceDesk(store: CohortVarianceStore, clockValue: clock.Clock): CohortVarianceDesk {
  return new CohortVarianceDesk(store, defaultCohortVarianceValidator(), clockValue, []);
}
