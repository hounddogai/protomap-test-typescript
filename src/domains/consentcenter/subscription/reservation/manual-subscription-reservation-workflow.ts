import * as clock from "../../../../kit/clock.js";
import {
  ManualSubscriptionReservationValidator,
  defaultManualSubscriptionReservationValidator,
} from "./manual-subscription-reservation-rules.js";
import { ManualSubscriptionReservationStore } from "./manual-subscription-reservation-store.js";

/** Moves manual subscription reservations through their life cycle and keeps a journal of what it did. */
export class ManualSubscriptionReservationCoordinator {
  store: ManualSubscriptionReservationStore;
  validator: ManualSubscriptionReservationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualSubscriptionReservationStore,
    validator: ManualSubscriptionReservationValidator,
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
      throw new Error(`manual subscription reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual subscription reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newManualSubscriptionReservationCoordinator(store: ManualSubscriptionReservationStore, clockValue: clock.Clock): ManualSubscriptionReservationCoordinator {
  return new ManualSubscriptionReservationCoordinator(
    store,
    defaultManualSubscriptionReservationValidator(),
    clockValue,
    [],
  );
}
