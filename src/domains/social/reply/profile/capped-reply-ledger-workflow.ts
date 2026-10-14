import * as clock from "../../../../kit/clock.js";
import { CappedReplyLedgerEngine, defaultCappedReplyLedgerEngine } from "./capped-reply-ledger-engine.js";
import { CappedReplyLedgerValidator, defaultCappedReplyLedgerValidator } from "./capped-reply-ledger-rules.js";
import { CappedReplyLedgerStore } from "./capped-reply-ledger-store.js";

/** Moves capped reply ledgers through their life cycle and keeps a journal of what it did. */
export class CappedReplyLedgerDesk {
  store: CappedReplyLedgerStore;
  validator: CappedReplyLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedReplyLedgerEngine;

  constructor(
    store: CappedReplyLedgerStore,
    validator: CappedReplyLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedReplyLedgerEngine,
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
      throw new Error(`capped reply ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped reply ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped reply ledger ${code} not found`);
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

export function newCappedReplyLedgerDesk(store: CappedReplyLedgerStore, clockValue: clock.Clock): CappedReplyLedgerDesk {
  return new CappedReplyLedgerDesk(
    store,
    defaultCappedReplyLedgerValidator(),
    clockValue,
    [],
    defaultCappedReplyLedgerEngine(),
  );
}
