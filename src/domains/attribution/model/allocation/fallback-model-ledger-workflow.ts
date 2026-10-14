import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackModelLedgerEngine, defaultFallbackModelLedgerEngine } from "./fallback-model-ledger-engine.js";
import { FallbackModelLedgerValidator, defaultFallbackModelLedgerValidator } from "./fallback-model-ledger-rules.js";
import { FallbackModelLedgerStore } from "./fallback-model-ledger-store.js";

/** Moves fallback model ledgers through their life cycle and keeps a journal of what it did. */
export class FallbackModelLedgerDesk {
  store: FallbackModelLedgerStore;
  validator: FallbackModelLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackModelLedgerEngine;

  constructor(
    store: FallbackModelLedgerStore,
    validator: FallbackModelLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackModelLedgerEngine,
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
      throw new Error(`fallback model ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback model ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback model ledger ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newFallbackModelLedgerDesk(store: FallbackModelLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackModelLedgerDesk {
  return new FallbackModelLedgerDesk(
    store,
    defaultFallbackModelLedgerValidator(),
    clockValue,
    [],
    defaultFallbackModelLedgerEngine(flagsValue),
  );
}
