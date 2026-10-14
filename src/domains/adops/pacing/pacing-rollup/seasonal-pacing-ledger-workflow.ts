import * as clock from "../../../../kit/clock.js";
import { SeasonalPacingLedgerEngine, defaultSeasonalPacingLedgerEngine } from "./seasonal-pacing-ledger-engine.js";
import {
  SeasonalPacingLedgerValidator,
  defaultSeasonalPacingLedgerValidator,
} from "./seasonal-pacing-ledger-rules.js";
import { SeasonalPacingLedgerStore } from "./seasonal-pacing-ledger-store.js";

/** Moves seasonal pacing ledgers through their life cycle and keeps a journal of what it did. */
export class SeasonalPacingLedgerService {
  store: SeasonalPacingLedgerStore;
  validator: SeasonalPacingLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalPacingLedgerEngine;

  constructor(
    store: SeasonalPacingLedgerStore,
    validator: SeasonalPacingLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalPacingLedgerEngine,
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
      throw new Error(`seasonal pacing ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal pacing ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal pacing ledger ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newSeasonalPacingLedgerService(store: SeasonalPacingLedgerStore, clockValue: clock.Clock): SeasonalPacingLedgerService {
  return new SeasonalPacingLedgerService(
    store,
    defaultSeasonalPacingLedgerValidator(),
    clockValue,
    [],
    defaultSeasonalPacingLedgerEngine(),
  );
}
