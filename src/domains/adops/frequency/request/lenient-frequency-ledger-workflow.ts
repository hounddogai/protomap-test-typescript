import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LenientFrequencyLedgerEngine,
  defaultLenientFrequencyLedgerEngine,
} from "./lenient-frequency-ledger-engine.js";
import {
  LenientFrequencyLedgerValidator,
  defaultLenientFrequencyLedgerValidator,
} from "./lenient-frequency-ledger-rules.js";
import { LenientFrequencyLedgerStore } from "./lenient-frequency-ledger-store.js";

/** Moves lenient frequency ledgers through their life cycle and keeps a journal of what it did. */
export class LenientFrequencyLedgerWorkflow {
  store: LenientFrequencyLedgerStore;
  validator: LenientFrequencyLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LenientFrequencyLedgerEngine;

  constructor(
    store: LenientFrequencyLedgerStore,
    validator: LenientFrequencyLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LenientFrequencyLedgerEngine,
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
      throw new Error(`lenient frequency ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient frequency ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient frequency ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientFrequencyLedgerWorkflow(store: LenientFrequencyLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): LenientFrequencyLedgerWorkflow {
  return new LenientFrequencyLedgerWorkflow(
    store,
    defaultLenientFrequencyLedgerValidator(),
    clockValue,
    [],
    defaultLenientFrequencyLedgerEngine(flagsValue),
  );
}
