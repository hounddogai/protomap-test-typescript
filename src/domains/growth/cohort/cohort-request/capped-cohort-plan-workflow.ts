import * as clock from "../../../../kit/clock.js";
import { CappedCohortPlanValidator, defaultCappedCohortPlanValidator } from "./capped-cohort-plan-rules.js";
import { CappedCohortPlanStore } from "./capped-cohort-plan-store.js";

/** Moves capped cohort plans through their life cycle and keeps a journal of what it did. */
export class CappedCohortPlanManager {
  store: CappedCohortPlanStore;
  validator: CappedCohortPlanValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedCohortPlanStore,
    validator: CappedCohortPlanValidator,
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
      throw new Error(`capped cohort plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped cohort plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newCappedCohortPlanManager(store: CappedCohortPlanStore, clockValue: clock.Clock): CappedCohortPlanManager {
  return new CappedCohortPlanManager(store, defaultCappedCohortPlanValidator(), clockValue, []);
}
