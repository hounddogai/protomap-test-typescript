import * as clock from "../../../../kit/clock.js";
import { RegionalModelAuditValidator, defaultRegionalModelAuditValidator } from "./regional-model-audit-rules.js";
import { RegionalModelAuditStore } from "./regional-model-audit-store.js";

/** Moves regional model audits through their life cycle and keeps a journal of what it did. */
export class RegionalModelAuditManager {
  store: RegionalModelAuditStore;
  validator: RegionalModelAuditValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalModelAuditStore,
    validator: RegionalModelAuditValidator,
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
      throw new Error(`regional model audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional model audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRegionalModelAuditManager(store: RegionalModelAuditStore, clockValue: clock.Clock): RegionalModelAuditManager {
  return new RegionalModelAuditManager(store, defaultRegionalModelAuditValidator(), clockValue, []);
}
