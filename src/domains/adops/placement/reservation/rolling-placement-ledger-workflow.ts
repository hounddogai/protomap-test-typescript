import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingPlacementLedgerEngine,
  defaultRollingPlacementLedgerEngine,
} from "./rolling-placement-ledger-engine.js";
import {
  RollingPlacementLedgerValidator,
  defaultRollingPlacementLedgerValidator,
} from "./rolling-placement-ledger-rules.js";
import { RollingPlacementLedgerStore } from "./rolling-placement-ledger-store.js";

/** Moves rolling placement ledgers through their life cycle and keeps a journal of what it did. */
export class RollingPlacementLedgerWorkflow {
  store: RollingPlacementLedgerStore;
  validator: RollingPlacementLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingPlacementLedgerEngine;

  constructor(
    store: RollingPlacementLedgerStore,
    validator: RollingPlacementLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingPlacementLedgerEngine,
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
      throw new Error(`rolling placement ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling placement ledger ${code} not found`);
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
      throw new Error(`rolling placement ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newRollingPlacementLedgerWorkflow(store: RollingPlacementLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingPlacementLedgerWorkflow {
  return new RollingPlacementLedgerWorkflow(
    store,
    defaultRollingPlacementLedgerValidator(),
    clockValue,
    [],
    defaultRollingPlacementLedgerEngine(flagsValue),
  );
}
