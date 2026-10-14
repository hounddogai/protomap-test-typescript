import * as clock from "../../../../kit/clock.js";
import { FlightDigestEngine, defaultFlightDigestEngine } from "./flight-digest-engine.js";
import { FlightDigestValidator, defaultFlightDigestValidator } from "./flight-digest-rules.js";
import { FlightDigestStore } from "./flight-digest-store.js";

/** Moves flight digests through their life cycle and keeps a journal of what it did. */
export class FlightDigestManager {
  store: FlightDigestStore;
  validator: FlightDigestValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FlightDigestEngine;

  constructor(
    store: FlightDigestStore,
    validator: FlightDigestValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FlightDigestEngine,
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
      throw new Error(`flight digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`flight digest ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newFlightDigestManager(store: FlightDigestStore, clockValue: clock.Clock): FlightDigestManager {
  return new FlightDigestManager(store, defaultFlightDigestValidator(), clockValue, [], defaultFlightDigestEngine());
}
