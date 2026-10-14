import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FlightGroupEngine, defaultFlightGroupEngine } from "./flight-group-engine.js";
import { FlightGroupValidator, defaultFlightGroupValidator } from "./flight-group-rules.js";
import { FlightGroupStore } from "./flight-group-store.js";

/** Moves flight groups through their life cycle and keeps a journal of what it did. */
export class FlightGroupDesk {
  store: FlightGroupStore;
  validator: FlightGroupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FlightGroupEngine;

  constructor(
    store: FlightGroupStore,
    validator: FlightGroupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FlightGroupEngine,
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
      throw new Error(`flight group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight group ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFlightGroupDesk(store: FlightGroupStore, clockValue: clock.Clock, flagsValue: flags.Registry): FlightGroupDesk {
  return new FlightGroupDesk(
    store,
    defaultFlightGroupValidator(),
    clockValue,
    [],
    defaultFlightGroupEngine(flagsValue),
  );
}
