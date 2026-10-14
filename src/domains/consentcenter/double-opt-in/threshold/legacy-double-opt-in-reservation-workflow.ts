import * as clock from "../../../../kit/clock.js";
import {
  LegacyDoubleOptInReservationValidator,
  defaultLegacyDoubleOptInReservationValidator,
} from "./legacy-double-opt-in-reservation-rules.js";
import { LegacyDoubleOptInReservationStore } from "./legacy-double-opt-in-reservation-store.js";

/** Moves legacy double opt in reservations through their life cycle and keeps a journal of what it did. */
export class LegacyDoubleOptInReservationWorkflow {
  store: LegacyDoubleOptInReservationStore;
  validator: LegacyDoubleOptInReservationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyDoubleOptInReservationStore,
    validator: LegacyDoubleOptInReservationValidator,
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
      throw new Error(`legacy double opt in reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy double opt in reservation ${code} not found`);
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

export function newLegacyDoubleOptInReservationWorkflow(store: LegacyDoubleOptInReservationStore, clockValue: clock.Clock): LegacyDoubleOptInReservationWorkflow {
  return new LegacyDoubleOptInReservationWorkflow(
    store,
    defaultLegacyDoubleOptInReservationValidator(),
    clockValue,
    [],
  );
}
