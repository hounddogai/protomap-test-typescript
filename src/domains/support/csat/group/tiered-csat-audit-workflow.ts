import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredCsatAuditEngine, defaultTieredCsatAuditEngine } from "./tiered-csat-audit-engine.js";
import { TieredCsatAuditValidator, defaultTieredCsatAuditValidator } from "./tiered-csat-audit-rules.js";
import { TieredCsatAuditStore } from "./tiered-csat-audit-store.js";

/** Moves tiered csat audits through their life cycle and keeps a journal of what it did. */
export class TieredCsatAuditDesk {
  store: TieredCsatAuditStore;
  validator: TieredCsatAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredCsatAuditEngine;

  constructor(
    store: TieredCsatAuditStore,
    validator: TieredCsatAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredCsatAuditEngine,
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
      throw new Error(`tiered csat audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered csat audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered csat audit ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredCsatAuditDesk(store: TieredCsatAuditStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredCsatAuditDesk {
  return new TieredCsatAuditDesk(
    store,
    defaultTieredCsatAuditValidator(),
    clockValue,
    [],
    defaultTieredCsatAuditEngine(flagsValue),
  );
}
