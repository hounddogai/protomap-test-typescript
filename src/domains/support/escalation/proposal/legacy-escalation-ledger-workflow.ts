import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  LegacyEscalationLedgerEngine,
  defaultLegacyEscalationLedgerEngine,
} from "./legacy-escalation-ledger-engine.js";
import {
  LegacyEscalationLedgerValidator,
  defaultLegacyEscalationLedgerValidator,
} from "./legacy-escalation-ledger-rules.js";
import { LegacyEscalationLedgerStore } from "./legacy-escalation-ledger-store.js";

/** Moves legacy escalation ledgers through their life cycle and keeps a journal of what it did. */
export class LegacyEscalationLedgerDesk {
  store: LegacyEscalationLedgerStore;
  validator: LegacyEscalationLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyEscalationLedgerEngine;

  constructor(
    store: LegacyEscalationLedgerStore,
    validator: LegacyEscalationLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyEscalationLedgerEngine,
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
      throw new Error(`legacy escalation ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy escalation ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy escalation ledger ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newLegacyEscalationLedgerDesk(store: LegacyEscalationLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyEscalationLedgerDesk {
  return new LegacyEscalationLedgerDesk(
    store,
    defaultLegacyEscalationLedgerValidator(),
    clockValue,
    [],
    defaultLegacyEscalationLedgerEngine(flagsValue),
  );
}
