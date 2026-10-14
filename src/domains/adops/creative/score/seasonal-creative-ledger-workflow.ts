import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalCreativeLedgerEngine,
  defaultSeasonalCreativeLedgerEngine,
} from "./seasonal-creative-ledger-engine.js";
import {
  SeasonalCreativeLedgerValidator,
  defaultSeasonalCreativeLedgerValidator,
} from "./seasonal-creative-ledger-rules.js";
import { SeasonalCreativeLedgerStore } from "./seasonal-creative-ledger-store.js";

/** Moves seasonal creative ledgers through their life cycle and keeps a journal of what it did. */
export class SeasonalCreativeLedgerManager {
  store: SeasonalCreativeLedgerStore;
  validator: SeasonalCreativeLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalCreativeLedgerEngine;

  constructor(
    store: SeasonalCreativeLedgerStore,
    validator: SeasonalCreativeLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalCreativeLedgerEngine,
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
      throw new Error(`seasonal creative ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal creative ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal creative ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalCreativeLedgerManager(store: SeasonalCreativeLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalCreativeLedgerManager {
  return new SeasonalCreativeLedgerManager(
    store,
    defaultSeasonalCreativeLedgerValidator(),
    clockValue,
    [],
    defaultSeasonalCreativeLedgerEngine(flagsValue),
  );
}
