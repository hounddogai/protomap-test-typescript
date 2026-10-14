import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PacingAuditEngine, defaultPacingAuditEngine } from "./pacing-audit-engine.js";
import { PacingAuditValidator, defaultPacingAuditValidator } from "./pacing-audit-rules.js";
import { PacingAuditStore } from "./pacing-audit-store.js";

/** Moves pacing audits through their life cycle and keeps a journal of what it did. */
export class PacingAuditDesk {
  store: PacingAuditStore;
  validator: PacingAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingAuditEngine;

  constructor(
    store: PacingAuditStore,
    validator: PacingAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingAuditEngine,
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
      throw new Error(`pacing audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing audit ${code} not found`);
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
      throw new Error(`pacing audit ${code} not found`);
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

export function newPacingAuditDesk(store: PacingAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): PacingAuditDesk {
  return new PacingAuditDesk(
    store,
    defaultPacingAuditValidator(),
    clockValue,
    [],
    defaultPacingAuditEngine(flagsValue),
  );
}
