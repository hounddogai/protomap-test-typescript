import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SeasonalBranchLedgerEngine, defaultSeasonalBranchLedgerEngine } from "./seasonal-branch-ledger-engine.js";
import {
  SeasonalBranchLedgerValidator,
  defaultSeasonalBranchLedgerValidator,
} from "./seasonal-branch-ledger-rules.js";
import { SeasonalBranchLedgerStore } from "./seasonal-branch-ledger-store.js";

/** Moves seasonal branch ledgers through their life cycle and keeps a journal of what it did. */
export class SeasonalBranchLedgerService {
  store: SeasonalBranchLedgerStore;
  validator: SeasonalBranchLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalBranchLedgerEngine;

  constructor(
    store: SeasonalBranchLedgerStore,
    validator: SeasonalBranchLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalBranchLedgerEngine,
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
      throw new Error(`seasonal branch ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal branch ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal branch ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newSeasonalBranchLedgerService(store: SeasonalBranchLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalBranchLedgerService {
  return new SeasonalBranchLedgerService(
    store,
    defaultSeasonalBranchLedgerValidator(),
    clockValue,
    [],
    defaultSeasonalBranchLedgerEngine(flagsValue),
  );
}
