import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PendingBadgeAuditEngine, defaultPendingBadgeAuditEngine } from "./pending-badge-audit-engine.js";
import { PendingBadgeAuditValidator, defaultPendingBadgeAuditValidator } from "./pending-badge-audit-rules.js";
import { PendingBadgeAuditStore } from "./pending-badge-audit-store.js";

/** Moves pending badge audits through their life cycle and keeps a journal of what it did. */
export class PendingBadgeAuditDesk {
  store: PendingBadgeAuditStore;
  validator: PendingBadgeAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingBadgeAuditEngine;

  constructor(
    store: PendingBadgeAuditStore,
    validator: PendingBadgeAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingBadgeAuditEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending badge audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending badge audit ${code} not found`);
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
      throw new Error(`pending badge audit ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingBadgeAuditDesk(store: PendingBadgeAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingBadgeAuditDesk {
  return new PendingBadgeAuditDesk(
    store,
    defaultPendingBadgeAuditValidator(),
    clockValue,
    [],
    defaultPendingBadgeAuditEngine(flagsValue),
  );
}
