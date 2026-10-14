import * as clock from "../../../../kit/clock.js";
import { TieredPacingAuditEngine, defaultTieredPacingAuditEngine } from "./tiered-pacing-audit-engine.js";
import { TieredPacingAuditValidator, defaultTieredPacingAuditValidator } from "./tiered-pacing-audit-rules.js";
import { TieredPacingAuditStore } from "./tiered-pacing-audit-store.js";

/** Moves tiered pacing audits through their life cycle and keeps a journal of what it did. */
export class TieredPacingAuditCoordinator {
  store: TieredPacingAuditStore;
  validator: TieredPacingAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredPacingAuditEngine;

  constructor(
    store: TieredPacingAuditStore,
    validator: TieredPacingAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredPacingAuditEngine,
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
      throw new Error(`tiered pacing audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered pacing audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered pacing audit ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredPacingAuditCoordinator(store: TieredPacingAuditStore, clockValue: clock.Clock): TieredPacingAuditCoordinator {
  return new TieredPacingAuditCoordinator(
    store,
    defaultTieredPacingAuditValidator(),
    clockValue,
    [],
    defaultTieredPacingAuditEngine(),
  );
}
