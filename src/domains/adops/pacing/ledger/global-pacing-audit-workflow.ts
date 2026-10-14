import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalPacingAuditEngine, defaultGlobalPacingAuditEngine } from "./global-pacing-audit-engine.js";
import { GlobalPacingAuditValidator, defaultGlobalPacingAuditValidator } from "./global-pacing-audit-rules.js";
import { GlobalPacingAuditStore } from "./global-pacing-audit-store.js";

/** Moves global pacing audits through their life cycle and keeps a journal of what it did. */
export class GlobalPacingAuditManager {
  store: GlobalPacingAuditStore;
  validator: GlobalPacingAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalPacingAuditEngine;

  constructor(
    store: GlobalPacingAuditStore,
    validator: GlobalPacingAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalPacingAuditEngine,
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
      throw new Error(`global pacing audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global pacing audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global pacing audit ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newGlobalPacingAuditManager(store: GlobalPacingAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalPacingAuditManager {
  return new GlobalPacingAuditManager(
    store,
    defaultGlobalPacingAuditValidator(),
    clockValue,
    [],
    defaultGlobalPacingAuditEngine(flagsValue),
  );
}
