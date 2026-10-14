import * as clock from "../../../../kit/clock.js";
import { TouchpointLedgerEngine, defaultTouchpointLedgerEngine } from "./touchpoint-ledger-engine.js";
import { TouchpointLedgerValidator, defaultTouchpointLedgerValidator } from "./touchpoint-ledger-rules.js";
import { TouchpointLedgerStore } from "./touchpoint-ledger-store.js";

/** Moves touchpoint ledgers through their life cycle and keeps a journal of what it did. */
export class TouchpointLedgerService {
  store: TouchpointLedgerStore;
  validator: TouchpointLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointLedgerEngine;

  constructor(
    store: TouchpointLedgerStore,
    validator: TouchpointLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointLedgerEngine,
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
      throw new Error(`touchpoint ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint ledger ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTouchpointLedgerService(store: TouchpointLedgerStore, clockValue: clock.Clock): TouchpointLedgerService {
  return new TouchpointLedgerService(
    store,
    defaultTouchpointLedgerValidator(),
    clockValue,
    [],
    defaultTouchpointLedgerEngine(),
  );
}
