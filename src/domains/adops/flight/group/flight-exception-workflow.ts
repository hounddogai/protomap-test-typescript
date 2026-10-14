import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FlightExceptionEngine, defaultFlightExceptionEngine } from "./flight-exception-engine.js";
import { FlightExceptionValidator, defaultFlightExceptionValidator } from "./flight-exception-rules.js";
import { FlightExceptionStore } from "./flight-exception-store.js";

/** Moves flight exceptions through their life cycle and keeps a journal of what it did. */
export class FlightExceptionService {
  store: FlightExceptionStore;
  validator: FlightExceptionValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FlightExceptionEngine;

  constructor(
    store: FlightExceptionStore,
    validator: FlightExceptionValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FlightExceptionEngine,
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
      throw new Error(`flight exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight exception ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newFlightExceptionService(store: FlightExceptionStore, clockValue: clock.Clock, flagsValue: flags.Registry): FlightExceptionService {
  return new FlightExceptionService(
    store,
    defaultFlightExceptionValidator(),
    clockValue,
    [],
    defaultFlightExceptionEngine(flagsValue),
  );
}
