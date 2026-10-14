import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SeasonalCsatAuditEngine, defaultSeasonalCsatAuditEngine } from "./seasonal-csat-audit-engine.js";
import { SeasonalCsatAuditValidator, defaultSeasonalCsatAuditValidator } from "./seasonal-csat-audit-rules.js";
import { SeasonalCsatAuditStore } from "./seasonal-csat-audit-store.js";

/** Moves seasonal csat audits through their life cycle and keeps a journal of what it did. */
export class SeasonalCsatAuditCoordinator {
  store: SeasonalCsatAuditStore;
  validator: SeasonalCsatAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalCsatAuditEngine;

  constructor(
    store: SeasonalCsatAuditStore,
    validator: SeasonalCsatAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalCsatAuditEngine,
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
      throw new Error(`seasonal csat audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal csat audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal csat audit ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalCsatAuditCoordinator(store: SeasonalCsatAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalCsatAuditCoordinator {
  return new SeasonalCsatAuditCoordinator(
    store,
    defaultSeasonalCsatAuditValidator(),
    clockValue,
    [],
    defaultSeasonalCsatAuditEngine(flagsValue),
  );
}
