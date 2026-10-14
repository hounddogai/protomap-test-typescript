import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RetentionAuditEngine, defaultRetentionAuditEngine } from "./retention-audit-engine.js";
import { RetentionAuditValidator, defaultRetentionAuditValidator } from "./retention-audit-rules.js";
import { RetentionAuditStore } from "./retention-audit-store.js";

/** Moves retention audits through their life cycle and keeps a journal of what it did. */
export class RetentionAuditManager {
  store: RetentionAuditStore;
  validator: RetentionAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RetentionAuditEngine;

  constructor(
    store: RetentionAuditStore,
    validator: RetentionAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RetentionAuditEngine,
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
      throw new Error(`retention audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`retention audit ${code} not found`);
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
      throw new Error(`retention audit ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRetentionAuditManager(store: RetentionAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): RetentionAuditManager {
  return new RetentionAuditManager(
    store,
    defaultRetentionAuditValidator(),
    clockValue,
    [],
    defaultRetentionAuditEngine(flagsValue),
  );
}
