import * as clock from "../../../../kit/clock.js";
import { CohortOverrideValidator, defaultCohortOverrideValidator } from "./cohort-override-rules.js";
import { CohortOverrideStore } from "./cohort-override-store.js";

/** Moves cohort overrides through their life cycle and keeps a journal of what it did. */
export class CohortOverrideDesk {
  store: CohortOverrideStore;
  validator: CohortOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CohortOverrideStore,
    validator: CohortOverrideValidator,
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
      throw new Error(`cohort override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newCohortOverrideDesk(store: CohortOverrideStore, clockValue: clock.Clock): CohortOverrideDesk {
  return new CohortOverrideDesk(store, defaultCohortOverrideValidator(), clockValue, []);
}
