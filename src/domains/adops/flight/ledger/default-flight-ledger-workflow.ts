import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultFlightLedgerEngine, defaultDefaultFlightLedgerEngine } from "./default-flight-ledger-engine.js";
import { DefaultFlightLedgerValidator, defaultDefaultFlightLedgerValidator } from "./default-flight-ledger-rules.js";
import { DefaultFlightLedgerStore } from "./default-flight-ledger-store.js";

/** Moves default flight ledgers through their life cycle and keeps a journal of what it did. */
export class DefaultFlightLedgerService {
  store: DefaultFlightLedgerStore;
  validator: DefaultFlightLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultFlightLedgerEngine;

  constructor(
    store: DefaultFlightLedgerStore,
    validator: DefaultFlightLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultFlightLedgerEngine,
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
      throw new Error(`default flight ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default flight ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default flight ledger ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newDefaultFlightLedgerService(store: DefaultFlightLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultFlightLedgerService {
  return new DefaultFlightLedgerService(
    store,
    defaultDefaultFlightLedgerValidator(),
    clockValue,
    [],
    defaultDefaultFlightLedgerEngine(flagsValue),
  );
}
