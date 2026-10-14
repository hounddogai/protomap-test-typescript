import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DefaultBranchLedgerEngine, defaultDefaultBranchLedgerEngine } from "./default-branch-ledger-engine.js";
import { DefaultBranchLedgerValidator, defaultDefaultBranchLedgerValidator } from "./default-branch-ledger-rules.js";
import { DefaultBranchLedgerStore } from "./default-branch-ledger-store.js";

/** Moves default branch ledgers through their life cycle and keeps a journal of what it did. */
export class DefaultBranchLedgerWorkflow {
  store: DefaultBranchLedgerStore;
  validator: DefaultBranchLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DefaultBranchLedgerEngine;

  constructor(
    store: DefaultBranchLedgerStore,
    validator: DefaultBranchLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DefaultBranchLedgerEngine,
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
      throw new Error(`default branch ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default branch ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default branch ledger ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newDefaultBranchLedgerWorkflow(store: DefaultBranchLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): DefaultBranchLedgerWorkflow {
  return new DefaultBranchLedgerWorkflow(
    store,
    defaultDefaultBranchLedgerValidator(),
    clockValue,
    [],
    defaultDefaultBranchLedgerEngine(flagsValue),
  );
}
