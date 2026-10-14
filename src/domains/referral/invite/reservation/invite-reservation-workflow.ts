import * as clock from "../../../../kit/clock.js";
import { InviteReservationEngine, defaultInviteReservationEngine } from "./invite-reservation-engine.js";
import { InviteReservationValidator, defaultInviteReservationValidator } from "./invite-reservation-rules.js";
import { InviteReservationStore } from "./invite-reservation-store.js";

/** Moves invite reservations through their life cycle and keeps a journal of what it did. */
export class InviteReservationService {
  store: InviteReservationStore;
  validator: InviteReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InviteReservationEngine;

  constructor(
    store: InviteReservationStore,
    validator: InviteReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InviteReservationEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`invite reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newInviteReservationService(store: InviteReservationStore, clockValue: clock.Clock): InviteReservationService {
  return new InviteReservationService(
    store,
    defaultInviteReservationValidator(),
    clockValue,
    [],
    defaultInviteReservationEngine(),
  );
}
