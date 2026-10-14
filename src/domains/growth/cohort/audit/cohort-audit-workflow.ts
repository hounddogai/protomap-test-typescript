import * as clock from "../../../../kit/clock.js";
import { CohortAuditEngine, defaultCohortAuditEngine } from "./cohort-audit-engine.js";
import { CohortAuditValidator, defaultCohortAuditValidator } from "./cohort-audit-rules.js";
import { CohortAuditStore } from "./cohort-audit-store.js";

/** Moves cohort audits through their life cycle and keeps a journal of what it did. */
export class CohortAuditWorkflow {
  store: CohortAuditStore;
  validator: CohortAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortAuditEngine;

  constructor(
    store: CohortAuditStore,
    validator: CohortAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortAuditEngine,
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
      throw new Error(`cohort audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort audit ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newCohortAuditWorkflow(store: CohortAuditStore, clockValue: clock.Clock): CohortAuditWorkflow {
  return new CohortAuditWorkflow(store, defaultCohortAuditValidator(), clockValue, [], defaultCohortAuditEngine());
}
