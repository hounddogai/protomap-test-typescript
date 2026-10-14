import * as clock from "../../../../kit/clock.js";
import { DomainAuditEngine, defaultDomainAuditEngine } from "./domain-audit-engine.js";
import { DomainAuditValidator, defaultDomainAuditValidator } from "./domain-audit-rules.js";
import { DomainAuditStore } from "./domain-audit-store.js";

/** Moves domain audits through their life cycle and keeps a journal of what it did. */
export class DomainAuditDesk {
  store: DomainAuditStore;
  validator: DomainAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DomainAuditEngine;

  constructor(
    store: DomainAuditStore,
    validator: DomainAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DomainAuditEngine,
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
      throw new Error(`domain audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`domain audit ${code} not found`);
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
      throw new Error(`domain audit ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newDomainAuditDesk(store: DomainAuditStore, clockValue: clock.Clock): DomainAuditDesk {
  return new DomainAuditDesk(store, defaultDomainAuditValidator(), clockValue, [], defaultDomainAuditEngine());
}
