import * as clock from "../../../../kit/clock.js";
import { ApprovalReservationEngine, defaultApprovalReservationEngine } from "./approval-reservation-engine.js";
import { ApprovalReservationValidator, defaultApprovalReservationValidator } from "./approval-reservation-rules.js";
import { ApprovalReservationStore } from "./approval-reservation-store.js";

/** Moves approval reservations through their life cycle and keeps a journal of what it did. */
export class ApprovalReservationDesk {
  store: ApprovalReservationStore;
  validator: ApprovalReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalReservationEngine;

  constructor(
    store: ApprovalReservationStore,
    validator: ApprovalReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalReservationEngine,
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
      throw new Error(`approval reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval reservation ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newApprovalReservationDesk(store: ApprovalReservationStore, clockValue: clock.Clock): ApprovalReservationDesk {
  return new ApprovalReservationDesk(
    store,
    defaultApprovalReservationValidator(),
    clockValue,
    [],
    defaultApprovalReservationEngine(),
  );
}
