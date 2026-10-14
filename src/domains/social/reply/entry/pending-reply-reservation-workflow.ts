import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingReplyReservationEngine,
  defaultPendingReplyReservationEngine,
} from "./pending-reply-reservation-engine.js";
import {
  PendingReplyReservationValidator,
  defaultPendingReplyReservationValidator,
} from "./pending-reply-reservation-rules.js";
import { PendingReplyReservationStore } from "./pending-reply-reservation-store.js";

/** Moves pending reply reservations through their life cycle and keeps a journal of what it did. */
export class PendingReplyReservationService {
  store: PendingReplyReservationStore;
  validator: PendingReplyReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingReplyReservationEngine;

  constructor(
    store: PendingReplyReservationStore,
    validator: PendingReplyReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingReplyReservationEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending reply reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending reply reservation ${code} not found`);
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
      throw new Error(`pending reply reservation ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPendingReplyReservationService(store: PendingReplyReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingReplyReservationService {
  return new PendingReplyReservationService(
    store,
    defaultPendingReplyReservationValidator(),
    clockValue,
    [],
    defaultPendingReplyReservationEngine(flagsValue),
  );
}
