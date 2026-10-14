import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredLevelReservationEngine,
  defaultTieredLevelReservationEngine,
} from "./tiered-level-reservation-engine.js";
import {
  TieredLevelReservationValidator,
  defaultTieredLevelReservationValidator,
} from "./tiered-level-reservation-rules.js";
import { TieredLevelReservationStore } from "./tiered-level-reservation-store.js";

/** Moves tiered level reservations through their life cycle and keeps a journal of what it did. */
export class TieredLevelReservationService {
  store: TieredLevelReservationStore;
  validator: TieredLevelReservationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredLevelReservationEngine;

  constructor(
    store: TieredLevelReservationStore,
    validator: TieredLevelReservationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredLevelReservationEngine,
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
      throw new Error(`tiered level reservation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered level reservation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered level reservation ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newTieredLevelReservationService(store: TieredLevelReservationStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredLevelReservationService {
  return new TieredLevelReservationService(
    store,
    defaultTieredLevelReservationValidator(),
    clockValue,
    [],
    defaultTieredLevelReservationEngine(flagsValue),
  );
}
