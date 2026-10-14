import * as clock from "../../../../kit/clock.js";
import {
  LegacyTicketViewAuditValidator,
  defaultLegacyTicketViewAuditValidator,
} from "./legacy-ticket-view-audit-rules.js";
import { LegacyTicketViewAuditStore } from "./legacy-ticket-view-audit-store.js";

/** Moves legacy ticket view audits through their life cycle and keeps a journal of what it did. */
export class LegacyTicketViewAuditManager {
  store: LegacyTicketViewAuditStore;
  validator: LegacyTicketViewAuditValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyTicketViewAuditStore,
    validator: LegacyTicketViewAuditValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy ticket view audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy ticket view audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newLegacyTicketViewAuditManager(store: LegacyTicketViewAuditStore, clockValue: clock.Clock): LegacyTicketViewAuditManager {
  return new LegacyTicketViewAuditManager(store, defaultLegacyTicketViewAuditValidator(), clockValue, []);
}
