import * as clock from "../../../../kit/clock.js";
import { CappedSlaAuditEngine, defaultCappedSlaAuditEngine } from "./capped-sla-audit-engine.js";
import { CappedSlaAuditValidator, defaultCappedSlaAuditValidator } from "./capped-sla-audit-rules.js";
import { CappedSlaAuditStore } from "./capped-sla-audit-store.js";

/** Moves capped sla audits through their life cycle and keeps a journal of what it did. */
export class CappedSlaAuditCoordinator {
  store: CappedSlaAuditStore;
  validator: CappedSlaAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedSlaAuditEngine;

  constructor(
    store: CappedSlaAuditStore,
    validator: CappedSlaAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedSlaAuditEngine,
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
      throw new Error(`capped sla audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped sla audit ${code} not found`);
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
      throw new Error(`capped sla audit ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newCappedSlaAuditCoordinator(store: CappedSlaAuditStore, clockValue: clock.Clock): CappedSlaAuditCoordinator {
  return new CappedSlaAuditCoordinator(
    store,
    defaultCappedSlaAuditValidator(),
    clockValue,
    [],
    defaultCappedSlaAuditEngine(),
  );
}
