import * as clock from "../../../../kit/clock.js";
import { CohortAssignmentValidator, defaultCohortAssignmentValidator } from "./cohort-assignment-rules.js";
import { CohortAssignmentStore } from "./cohort-assignment-store.js";

/** Moves cohort assignments through their life cycle and keeps a journal of what it did. */
export class CohortAssignmentCoordinator {
  store: CohortAssignmentStore;
  validator: CohortAssignmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CohortAssignmentStore,
    validator: CohortAssignmentValidator,
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
      throw new Error(`cohort assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort assignment ${code} not found`);
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
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCohortAssignmentCoordinator(store: CohortAssignmentStore, clockValue: clock.Clock): CohortAssignmentCoordinator {
  return new CohortAssignmentCoordinator(store, defaultCohortAssignmentValidator(), clockValue, []);
}
