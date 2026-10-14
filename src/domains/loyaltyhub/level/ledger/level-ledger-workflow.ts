import * as clock from "../../../../kit/clock.js";
import { LevelLedgerEngine, defaultLevelLedgerEngine } from "./level-ledger-engine.js";
import { LevelLedgerValidator, defaultLevelLedgerValidator } from "./level-ledger-rules.js";
import { LevelLedgerStore } from "./level-ledger-store.js";

/** Moves level ledgers through their life cycle and keeps a journal of what it did. */
export class LevelLedgerWorkflow {
  store: LevelLedgerStore;
  validator: LevelLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LevelLedgerEngine;

  constructor(
    store: LevelLedgerStore,
    validator: LevelLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LevelLedgerEngine,
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
      throw new Error(`level ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level ledger ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLevelLedgerWorkflow(store: LevelLedgerStore, clockValue: clock.Clock): LevelLedgerWorkflow {
  return new LevelLedgerWorkflow(store, defaultLevelLedgerValidator(), clockValue, [], defaultLevelLedgerEngine());
}
