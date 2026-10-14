import * as clock from "../../../../kit/clock.js";
import { CohortProposalEngine, defaultCohortProposalEngine } from "./cohort-proposal-engine.js";
import { CohortProposalValidator, defaultCohortProposalValidator } from "./cohort-proposal-rules.js";
import { CohortProposalStore } from "./cohort-proposal-store.js";

/** Moves cohort proposals through their life cycle and keeps a journal of what it did. */
export class CohortProposalDesk {
  store: CohortProposalStore;
  validator: CohortProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortProposalEngine;

  constructor(
    store: CohortProposalStore,
    validator: CohortProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortProposalEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort proposal ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newCohortProposalDesk(store: CohortProposalStore, clockValue: clock.Clock): CohortProposalDesk {
  return new CohortProposalDesk(store, defaultCohortProposalValidator(), clockValue, [], defaultCohortProposalEngine());
}
