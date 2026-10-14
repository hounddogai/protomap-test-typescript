import * as clock from "../../../../kit/clock.js";
import { EnrollmentGroupValidator, defaultEnrollmentGroupValidator } from "./enrollment-group-rules.js";
import { EnrollmentGroupStore } from "./enrollment-group-store.js";

/** Moves enrollment groups through their life cycle and keeps a journal of what it did. */
export class EnrollmentGroupWorkflow {
  store: EnrollmentGroupStore;
  validator: EnrollmentGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: EnrollmentGroupStore,
    validator: EnrollmentGroupValidator,
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
      throw new Error(`enrollment group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`enrollment group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newEnrollmentGroupWorkflow(store: EnrollmentGroupStore, clockValue: clock.Clock): EnrollmentGroupWorkflow {
  return new EnrollmentGroupWorkflow(store, defaultEnrollmentGroupValidator(), clockValue, []);
}
