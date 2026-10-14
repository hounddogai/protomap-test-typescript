import * as clock from "../../../../kit/clock.js";
import { PendingTierAuditEngine, defaultPendingTierAuditEngine } from "./pending-tier-audit-engine.js";
import { PendingTierAuditValidator, defaultPendingTierAuditValidator } from "./pending-tier-audit-rules.js";
import { PendingTierAuditStore } from "./pending-tier-audit-store.js";

/** Moves pending tier audits through their life cycle and keeps a journal of what it did. */
export class PendingTierAuditWorkflow {
  store: PendingTierAuditStore;
  validator: PendingTierAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingTierAuditEngine;

  constructor(
    store: PendingTierAuditStore,
    validator: PendingTierAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingTierAuditEngine,
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
      throw new Error(`pending tier audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending tier audit ${code} not found`);
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
      throw new Error(`pending tier audit ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newPendingTierAuditWorkflow(store: PendingTierAuditStore, clockValue: clock.Clock): PendingTierAuditWorkflow {
  return new PendingTierAuditWorkflow(
    store,
    defaultPendingTierAuditValidator(),
    clockValue,
    [],
    defaultPendingTierAuditEngine(),
  );
}
