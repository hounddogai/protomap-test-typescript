import * as clock from "../../../../kit/clock.js";
import {
  PrimaryEscalationReservationEngine,
  defaultPrimaryEscalationReservationEngine,
} from "./primary-escalation-reservation-engine.js";
import {
  PrimaryEscalationReservationValidator,
  defaultPrimaryEscalationReservationValidator,
} from "./primary-escalation-reservation-rules.js";
import { PrimaryEscalationReservationStore } from "./primary-escalation-reservation-store.js";

/** Moves primary escalation reservations through their life cycle and keeps a journal of what it did. */
export class PrimaryEscalationReservationManager {
  store: PrimaryEscalationReservationStore;
  validator: PrimaryEscalationReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryEscalationReservationEngine;

  constructor(
    store: PrimaryEscalationReservationStore,
    validator: PrimaryEscalationReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryEscalationReservationEngine,
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
      throw new Error(`primary escalation reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary escalation reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary escalation reservation ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newPrimaryEscalationReservationManager(store: PrimaryEscalationReservationStore, clockValue: clock.Clock): PrimaryEscalationReservationManager {
  return new PrimaryEscalationReservationManager(
    store,
    defaultPrimaryEscalationReservationValidator(),
    clockValue,
    [],
    defaultPrimaryEscalationReservationEngine(),
  );
}
