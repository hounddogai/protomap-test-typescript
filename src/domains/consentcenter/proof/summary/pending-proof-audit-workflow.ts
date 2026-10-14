import * as clock from "../../../../kit/clock.js";
import { PendingProofAuditEngine, defaultPendingProofAuditEngine } from "./pending-proof-audit-engine.js";
import { PendingProofAuditValidator, defaultPendingProofAuditValidator } from "./pending-proof-audit-rules.js";
import { PendingProofAuditStore } from "./pending-proof-audit-store.js";

/** Moves pending proof audits through their life cycle and keeps a journal of what it did. */
export class PendingProofAuditWorkflow {
  store: PendingProofAuditStore;
  validator: PendingProofAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingProofAuditEngine;

  constructor(
    store: PendingProofAuditStore,
    validator: PendingProofAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingProofAuditEngine,
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
      throw new Error(`pending proof audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending proof audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending proof audit ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPendingProofAuditWorkflow(store: PendingProofAuditStore, clockValue: clock.Clock): PendingProofAuditWorkflow {
  return new PendingProofAuditWorkflow(
    store,
    defaultPendingProofAuditValidator(),
    clockValue,
    [],
    defaultPendingProofAuditEngine(),
  );
}
