import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingActivationReservationEngine,
  defaultRollingActivationReservationEngine,
} from "./rolling-activation-reservation-engine.js";
import {
  RollingActivationReservationValidator,
  defaultRollingActivationReservationValidator,
} from "./rolling-activation-reservation-rules.js";
import { RollingActivationReservationStore } from "./rolling-activation-reservation-store.js";

/** Moves rolling activation reservations through their life cycle and keeps a journal of what it did. */
export class RollingActivationReservationService {
  store: RollingActivationReservationStore;
  validator: RollingActivationReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingActivationReservationEngine;

  constructor(
    store: RollingActivationReservationStore,
    validator: RollingActivationReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingActivationReservationEngine,
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
      throw new Error(`rolling activation reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling activation reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling activation reservation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRollingActivationReservationService(store: RollingActivationReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingActivationReservationService {
  return new RollingActivationReservationService(
    store,
    defaultRollingActivationReservationValidator(),
    clockValue,
    [],
    defaultRollingActivationReservationEngine(flagsValue),
  );
}
