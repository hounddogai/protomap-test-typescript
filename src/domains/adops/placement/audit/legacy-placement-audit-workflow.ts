import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyPlacementAuditEngine, defaultLegacyPlacementAuditEngine } from "./legacy-placement-audit-engine.js";
import {
  LegacyPlacementAuditValidator,
  defaultLegacyPlacementAuditValidator,
} from "./legacy-placement-audit-rules.js";
import { LegacyPlacementAuditStore } from "./legacy-placement-audit-store.js";

/** Moves legacy placement audits through their life cycle and keeps a journal of what it did. */
export class LegacyPlacementAuditManager {
  store: LegacyPlacementAuditStore;
  validator: LegacyPlacementAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyPlacementAuditEngine;

  constructor(
    store: LegacyPlacementAuditStore,
    validator: LegacyPlacementAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyPlacementAuditEngine,
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
      throw new Error(`legacy placement audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy placement audit ${code} not found`);
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
      throw new Error(`legacy placement audit ${code} not found`);
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

export function newLegacyPlacementAuditManager(store: LegacyPlacementAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyPlacementAuditManager {
  return new LegacyPlacementAuditManager(
    store,
    defaultLegacyPlacementAuditValidator(),
    clockValue,
    [],
    defaultLegacyPlacementAuditEngine(flagsValue),
  );
}
