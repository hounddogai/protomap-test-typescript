import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  RollingExitRuleLedgerEngine,
  defaultRollingExitRuleLedgerEngine,
} from "./rolling-exit-rule-ledger-engine.js";
import {
  RollingExitRuleLedgerValidator,
  defaultRollingExitRuleLedgerValidator,
} from "./rolling-exit-rule-ledger-rules.js";
import { RollingExitRuleLedgerStore } from "./rolling-exit-rule-ledger-store.js";

/** Moves rolling exit rule ledgers through their life cycle and keeps a journal of what it did. */
export class RollingExitRuleLedgerDesk {
  store: RollingExitRuleLedgerStore;
  validator: RollingExitRuleLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingExitRuleLedgerEngine;

  constructor(
    store: RollingExitRuleLedgerStore,
    validator: RollingExitRuleLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingExitRuleLedgerEngine,
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
      throw new Error(`rolling exit rule ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling exit rule ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling exit rule ledger ${code} not found`);
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

export function newRollingExitRuleLedgerDesk(store: RollingExitRuleLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingExitRuleLedgerDesk {
  return new RollingExitRuleLedgerDesk(
    store,
    defaultRollingExitRuleLedgerValidator(),
    clockValue,
    [],
    defaultRollingExitRuleLedgerEngine(flagsValue),
  );
}
