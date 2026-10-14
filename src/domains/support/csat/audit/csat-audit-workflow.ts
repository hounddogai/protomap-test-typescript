import * as clock from "../../../../kit/clock.js";
import { CsatAuditValidator, defaultCsatAuditValidator } from "./csat-audit-rules.js";
import { CsatAuditStore } from "./csat-audit-store.js";

/** Moves csat audits through their life cycle and keeps a journal of what it did. */
export class CsatAuditDesk {
  store: CsatAuditStore;
  validator: CsatAuditValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: CsatAuditStore, validator: CsatAuditValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`csat audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newCsatAuditDesk(store: CsatAuditStore, clockValue: clock.Clock): CsatAuditDesk {
  return new CsatAuditDesk(store, defaultCsatAuditValidator(), clockValue, []);
}
