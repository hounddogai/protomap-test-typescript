import * as clock from "../../../../kit/clock.js";
import { CohortClaimEngine, defaultCohortClaimEngine } from "./cohort-claim-engine.js";
import { CohortClaimValidator, defaultCohortClaimValidator } from "./cohort-claim-rules.js";
import { CohortClaimStore } from "./cohort-claim-store.js";

/** Moves cohort claims through their life cycle and keeps a journal of what it did. */
export class CohortClaimService {
  store: CohortClaimStore;
  validator: CohortClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortClaimEngine;

  constructor(
    store: CohortClaimStore,
    validator: CohortClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortClaimEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort claim ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCohortClaimService(store: CohortClaimStore, clockValue: clock.Clock): CohortClaimService {
  return new CohortClaimService(store, defaultCohortClaimValidator(), clockValue, [], defaultCohortClaimEngine());
}
