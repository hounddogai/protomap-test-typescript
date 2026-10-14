import * as clock from "../../../../kit/clock.js";
import {
  StrictEnrollmentAdjustmentValidator,
  defaultStrictEnrollmentAdjustmentValidator,
} from "./strict-enrollment-adjustment-rules.js";
import { StrictEnrollmentAdjustmentStore } from "./strict-enrollment-adjustment-store.js";

/** Moves strict enrollment adjustments through their life cycle and keeps a journal of what it did. */
export class StrictEnrollmentAdjustmentManager {
  store: StrictEnrollmentAdjustmentStore;
  validator: StrictEnrollmentAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictEnrollmentAdjustmentStore,
    validator: StrictEnrollmentAdjustmentValidator,
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
      throw new Error(`strict enrollment adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict enrollment adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newStrictEnrollmentAdjustmentManager(store: StrictEnrollmentAdjustmentStore, clockValue: clock.Clock): StrictEnrollmentAdjustmentManager {
  return new StrictEnrollmentAdjustmentManager(store, defaultStrictEnrollmentAdjustmentValidator(), clockValue, []);
}
