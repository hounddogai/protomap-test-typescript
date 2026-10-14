import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredPlacementLedgerEngine, defaultTieredPlacementLedgerEngine } from "./tiered-placement-ledger-engine.js";
import {
  TieredPlacementLedgerValidator,
  defaultTieredPlacementLedgerValidator,
} from "./tiered-placement-ledger-rules.js";
import { TieredPlacementLedgerStore } from "./tiered-placement-ledger-store.js";

/** Moves tiered placement ledgers through their life cycle and keeps a journal of what it did. */
export class TieredPlacementLedgerManager {
  store: TieredPlacementLedgerStore;
  validator: TieredPlacementLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredPlacementLedgerEngine;

  constructor(
    store: TieredPlacementLedgerStore,
    validator: TieredPlacementLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredPlacementLedgerEngine,
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
      throw new Error(`tiered placement ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered placement ledger ${code} not found`);
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
      throw new Error(`tiered placement ledger ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newTieredPlacementLedgerManager(store: TieredPlacementLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredPlacementLedgerManager {
  return new TieredPlacementLedgerManager(
    store,
    defaultTieredPlacementLedgerValidator(),
    clockValue,
    [],
    defaultTieredPlacementLedgerEngine(flagsValue),
  );
}
