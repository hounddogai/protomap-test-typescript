import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SlaAuditEngine, defaultSlaAuditEngine } from "./sla-audit-engine.js";
import { SlaAuditValidator, defaultSlaAuditValidator } from "./sla-audit-rules.js";
import { SlaAuditStore } from "./sla-audit-store.js";

/** Moves sla audits through their life cycle and keeps a journal of what it did. */
export class SlaAuditCoordinator {
  store: SlaAuditStore;
  validator: SlaAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SlaAuditEngine;

  constructor(
    store: SlaAuditStore,
    validator: SlaAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SlaAuditEngine,
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
      throw new Error(`sla audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sla audit ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSlaAuditCoordinator(store: SlaAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): SlaAuditCoordinator {
  return new SlaAuditCoordinator(store, defaultSlaAuditValidator(), clockValue, [], defaultSlaAuditEngine(flagsValue));
}
