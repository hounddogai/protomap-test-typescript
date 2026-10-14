import * as clock from "../../../../kit/clock.js";
import { ActivationReservationEngine, defaultActivationReservationEngine } from "./activation-reservation-engine.js";
import {
  ActivationReservationValidator,
  defaultActivationReservationValidator,
} from "./activation-reservation-rules.js";
import { ActivationReservationStore } from "./activation-reservation-store.js";

/** Moves activation reservations through their life cycle and keeps a journal of what it did. */
export class ActivationReservationDesk {
  store: ActivationReservationStore;
  validator: ActivationReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationReservationEngine;

  constructor(
    store: ActivationReservationStore,
    validator: ActivationReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationReservationEngine,
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
      throw new Error(`activation reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation reservation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newActivationReservationDesk(store: ActivationReservationStore, clockValue: clock.Clock): ActivationReservationDesk {
  return new ActivationReservationDesk(
    store,
    defaultActivationReservationValidator(),
    clockValue,
    [],
    defaultActivationReservationEngine(),
  );
}
