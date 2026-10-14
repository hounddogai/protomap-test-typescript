import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RollingPlacementAuditEngine, defaultRollingPlacementAuditEngine } from "./rolling-placement-audit-engine.js";
import {
  RollingPlacementAuditValidator,
  defaultRollingPlacementAuditValidator,
} from "./rolling-placement-audit-rules.js";
import { RollingPlacementAuditStore } from "./rolling-placement-audit-store.js";

/** Moves rolling placement audits through their life cycle and keeps a journal of what it did. */
export class RollingPlacementAuditWorkflow {
  store: RollingPlacementAuditStore;
  validator: RollingPlacementAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RollingPlacementAuditEngine;

  constructor(
    store: RollingPlacementAuditStore,
    validator: RollingPlacementAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RollingPlacementAuditEngine,
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
      throw new Error(`rolling placement audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling placement audit ${code} not found`);
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
      throw new Error(`rolling placement audit ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRollingPlacementAuditWorkflow(store: RollingPlacementAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): RollingPlacementAuditWorkflow {
  return new RollingPlacementAuditWorkflow(
    store,
    defaultRollingPlacementAuditValidator(),
    clockValue,
    [],
    defaultRollingPlacementAuditEngine(flagsValue),
  );
}
