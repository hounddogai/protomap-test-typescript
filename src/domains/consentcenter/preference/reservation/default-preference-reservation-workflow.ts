import * as clock from "../../../../kit/clock.js";
import {
  DefaultPreferenceReservationValidator,
  defaultDefaultPreferenceReservationValidator,
} from "./default-preference-reservation-rules.js";
import { DefaultPreferenceReservationStore } from "./default-preference-reservation-store.js";

/** Moves default preference reservations through their life cycle and keeps a journal of what it did. */
export class DefaultPreferenceReservationCoordinator {
  store: DefaultPreferenceReservationStore;
  validator: DefaultPreferenceReservationValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultPreferenceReservationStore,
    validator: DefaultPreferenceReservationValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default preference reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default preference reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newDefaultPreferenceReservationCoordinator(store: DefaultPreferenceReservationStore, clockValue: clock.Clock): DefaultPreferenceReservationCoordinator {
  return new DefaultPreferenceReservationCoordinator(
    store,
    defaultDefaultPreferenceReservationValidator(),
    clockValue,
    [],
  );
}
