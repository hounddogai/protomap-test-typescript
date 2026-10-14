import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { BranchAuditEngine, defaultBranchAuditEngine } from "./branch-audit-engine.js";
import { BranchAuditValidator, defaultBranchAuditValidator } from "./branch-audit-rules.js";
import { BranchAuditStore } from "./branch-audit-store.js";

/** Moves branch audits through their life cycle and keeps a journal of what it did. */
export class BranchAuditDesk {
  store: BranchAuditStore;
  validator: BranchAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BranchAuditEngine;

  constructor(
    store: BranchAuditStore,
    validator: BranchAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BranchAuditEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`branch audit ${code} not found`);
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

export function newBranchAuditDesk(store: BranchAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): BranchAuditDesk {
  return new BranchAuditDesk(
    store,
    defaultBranchAuditValidator(),
    clockValue,
    [],
    defaultBranchAuditEngine(flagsValue),
  );
}
