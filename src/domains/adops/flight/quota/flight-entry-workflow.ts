import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FlightEntryEngine, defaultFlightEntryEngine } from "./flight-entry-engine.js";
import { FlightEntryValidator, defaultFlightEntryValidator } from "./flight-entry-rules.js";
import { FlightEntryStore } from "./flight-entry-store.js";

/** Moves flight entries through their life cycle and keeps a journal of what it did. */
export class FlightEntryService {
  store: FlightEntryStore;
  validator: FlightEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FlightEntryEngine;

  constructor(
    store: FlightEntryStore,
    validator: FlightEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FlightEntryEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight entry ${code} not found`);
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

export function newFlightEntryService(store: FlightEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): FlightEntryService {
  return new FlightEntryService(
    store,
    defaultFlightEntryValidator(),
    clockValue,
    [],
    defaultFlightEntryEngine(flagsValue),
  );
}
