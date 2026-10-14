import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  AdaptiveTicketViewLedgerEngine,
  defaultAdaptiveTicketViewLedgerEngine,
} from "./adaptive-ticket-view-ledger-engine.js";
import {
  AdaptiveTicketViewLedgerValidator,
  defaultAdaptiveTicketViewLedgerValidator,
} from "./adaptive-ticket-view-ledger-rules.js";
import { AdaptiveTicketViewLedgerStore } from "./adaptive-ticket-view-ledger-store.js";

/** Moves adaptive ticket view ledgers through their life cycle and keeps a journal of what it did. */
export class AdaptiveTicketViewLedgerDesk {
  store: AdaptiveTicketViewLedgerStore;
  validator: AdaptiveTicketViewLedgerValidator;
  clock: clock.Clock;
  journal: string[];
  engine: AdaptiveTicketViewLedgerEngine;

  constructor(
    store: AdaptiveTicketViewLedgerStore,
    validator: AdaptiveTicketViewLedgerValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: AdaptiveTicketViewLedgerEngine,
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
      throw new Error(`adaptive ticket view ledger ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive ticket view ledger ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive ticket view ledger ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newAdaptiveTicketViewLedgerDesk(store: AdaptiveTicketViewLedgerStore, clockValue: clock.Clock, flagsValue: flags.Registry): AdaptiveTicketViewLedgerDesk {
  return new AdaptiveTicketViewLedgerDesk(
    store,
    defaultAdaptiveTicketViewLedgerValidator(),
    clockValue,
    [],
    defaultAdaptiveTicketViewLedgerEngine(flagsValue),
  );
}
