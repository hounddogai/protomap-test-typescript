import * as clock from "../../../../kit/clock.js";
import { ProofAuditEngine, defaultProofAuditEngine } from "./proof-audit-engine.js";
import { ProofAuditValidator, defaultProofAuditValidator } from "./proof-audit-rules.js";
import { ProofAuditStore } from "./proof-audit-store.js";

/** Moves proof audits through their life cycle and keeps a journal of what it did. */
export class ProofAuditManager {
  store: ProofAuditStore;
  validator: ProofAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofAuditEngine;

  constructor(
    store: ProofAuditStore,
    validator: ProofAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofAuditEngine,
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
      throw new Error(`proof audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof audit ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newProofAuditManager(store: ProofAuditStore, clockValue: clock.Clock): ProofAuditManager {
  return new ProofAuditManager(store, defaultProofAuditValidator(), clockValue, [], defaultProofAuditEngine());
}
