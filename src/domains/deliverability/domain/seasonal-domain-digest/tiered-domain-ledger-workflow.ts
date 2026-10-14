import * as clock from "../../../../kit/clock.js";
import { TieredDomainLedgerEngine, defaultTieredDomainLedgerEngine } from "./tiered-domain-ledger-engine.js";
import { TieredDomainLedgerValidator, defaultTieredDomainLedgerValidator } from "./tiered-domain-ledger-rules.js";
import { TieredDomainLedgerStore } from "./tiered-domain-ledger-store.js";

/** Moves tiered domain ledgers through their life cycle and keeps a journal of what it did. */
export class TieredDomainLedgerService {
  store: TieredDomainLedgerStore;
  validator: TieredDomainLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredDomainLedgerEngine;

  constructor(
    store: TieredDomainLedgerStore,
    validator: TieredDomainLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredDomainLedgerEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered domain ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered domain ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered domain ledger ${code} not found`);
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

export function newTieredDomainLedgerService(store: TieredDomainLedgerStore, clockValue: clock.Clock): TieredDomainLedgerService {
  return new TieredDomainLedgerService(
    store,
    defaultTieredDomainLedgerValidator(),
    clockValue,
    [],
    defaultTieredDomainLedgerEngine(),
  );
}
