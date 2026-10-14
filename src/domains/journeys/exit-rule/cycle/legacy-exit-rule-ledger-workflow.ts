import * as clock from "../../../../kit/clock.js";
import {
  LegacyExitRuleLedgerValidator,
  defaultLegacyExitRuleLedgerValidator,
} from "./legacy-exit-rule-ledger-rules.js";
import { LegacyExitRuleLedgerStore } from "./legacy-exit-rule-ledger-store.js";

/** Moves legacy exit rule ledgers through their life cycle and keeps a journal of what it did. */
export class LegacyExitRuleLedgerService {
  store: LegacyExitRuleLedgerStore;
  validator: LegacyExitRuleLedgerValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyExitRuleLedgerStore,
    validator: LegacyExitRuleLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy exit rule ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy exit rule ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newLegacyExitRuleLedgerService(store: LegacyExitRuleLedgerStore, clockValue: clock.Clock): LegacyExitRuleLedgerService {
  return new LegacyExitRuleLedgerService(store, defaultLegacyExitRuleLedgerValidator(), clockValue, []);
}
