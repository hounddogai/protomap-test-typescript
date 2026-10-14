import * as clock from "../../../../kit/clock.js";
import { TieredCohortAuditEngine, defaultTieredCohortAuditEngine } from "./tiered-cohort-audit-engine.js";
import { TieredCohortAuditValidator, defaultTieredCohortAuditValidator } from "./tiered-cohort-audit-rules.js";
import { TieredCohortAuditStore } from "./tiered-cohort-audit-store.js";

/** Moves tiered cohort audits through their life cycle and keeps a journal of what it did. */
export class TieredCohortAuditWorkflow {
  store: TieredCohortAuditStore;
  validator: TieredCohortAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredCohortAuditEngine;

  constructor(
    store: TieredCohortAuditStore,
    validator: TieredCohortAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredCohortAuditEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered cohort audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered cohort audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered cohort audit ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newTieredCohortAuditWorkflow(store: TieredCohortAuditStore, clockValue: clock.Clock): TieredCohortAuditWorkflow {
  return new TieredCohortAuditWorkflow(
    store,
    defaultTieredCohortAuditValidator(),
    clockValue,
    [],
    defaultTieredCohortAuditEngine(),
  );
}
