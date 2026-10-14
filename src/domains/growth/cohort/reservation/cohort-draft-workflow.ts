import * as clock from "../../../../kit/clock.js";
import { CohortDraftValidator, defaultCohortDraftValidator } from "./cohort-draft-rules.js";
import { CohortDraftStore } from "./cohort-draft-store.js";

/** Moves cohort drafts through their life cycle and keeps a journal of what it did. */
export class CohortDraftService {
  store: CohortDraftStore;
  validator: CohortDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CohortDraftStore,
    validator: CohortDraftValidator,
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
      throw new Error(`cohort draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newCohortDraftService(store: CohortDraftStore, clockValue: clock.Clock): CohortDraftService {
  return new CohortDraftService(store, defaultCohortDraftValidator(), clockValue, []);
}
