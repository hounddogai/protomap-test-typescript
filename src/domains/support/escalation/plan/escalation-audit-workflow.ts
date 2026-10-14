import * as clock from "../../../../kit/clock.js";
import { EscalationAuditEngine, defaultEscalationAuditEngine } from "./escalation-audit-engine.js";
import { EscalationAuditValidator, defaultEscalationAuditValidator } from "./escalation-audit-rules.js";
import { EscalationAuditStore } from "./escalation-audit-store.js";

/** Moves escalation audits through their life cycle and keeps a journal of what it did. */
export class EscalationAuditDesk {
  store: EscalationAuditStore;
  validator: EscalationAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EscalationAuditEngine;

  constructor(
    store: EscalationAuditStore,
    validator: EscalationAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EscalationAuditEngine,
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
      throw new Error(`escalation audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation audit ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newEscalationAuditDesk(store: EscalationAuditStore, clockValue: clock.Clock): EscalationAuditDesk {
  return new EscalationAuditDesk(
    store,
    defaultEscalationAuditValidator(),
    clockValue,
    [],
    defaultEscalationAuditEngine(),
  );
}
