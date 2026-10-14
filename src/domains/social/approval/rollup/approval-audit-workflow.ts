import * as clock from "../../../../kit/clock.js";
import { ApprovalAuditEngine, defaultApprovalAuditEngine } from "./approval-audit-engine.js";
import { ApprovalAuditValidator, defaultApprovalAuditValidator } from "./approval-audit-rules.js";
import { ApprovalAuditStore } from "./approval-audit-store.js";

/** Moves approval audits through their life cycle and keeps a journal of what it did. */
export class ApprovalAuditManager {
  store: ApprovalAuditStore;
  validator: ApprovalAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ApprovalAuditEngine;

  constructor(
    store: ApprovalAuditStore,
    validator: ApprovalAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ApprovalAuditEngine,
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
      throw new Error(`approval audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`approval audit ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newApprovalAuditManager(store: ApprovalAuditStore, clockValue: clock.Clock): ApprovalAuditManager {
  return new ApprovalAuditManager(store, defaultApprovalAuditValidator(), clockValue, [], defaultApprovalAuditEngine());
}
