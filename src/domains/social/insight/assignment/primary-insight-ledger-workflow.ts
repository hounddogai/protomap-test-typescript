import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryInsightLedgerEngine, defaultPrimaryInsightLedgerEngine } from "./primary-insight-ledger-engine.js";
import {
  PrimaryInsightLedgerValidator,
  defaultPrimaryInsightLedgerValidator,
} from "./primary-insight-ledger-rules.js";
import { PrimaryInsightLedgerStore } from "./primary-insight-ledger-store.js";

/** Moves primary insight ledgers through their life cycle and keeps a journal of what it did. */
export class PrimaryInsightLedgerManager {
  store: PrimaryInsightLedgerStore;
  validator: PrimaryInsightLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryInsightLedgerEngine;

  constructor(
    store: PrimaryInsightLedgerStore,
    validator: PrimaryInsightLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryInsightLedgerEngine,
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
      throw new Error(`primary insight ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary insight ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary insight ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryInsightLedgerManager(store: PrimaryInsightLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryInsightLedgerManager {
  return new PrimaryInsightLedgerManager(
    store,
    defaultPrimaryInsightLedgerValidator(),
    clockValue,
    [],
    defaultPrimaryInsightLedgerEngine(flagsValue),
  );
}
