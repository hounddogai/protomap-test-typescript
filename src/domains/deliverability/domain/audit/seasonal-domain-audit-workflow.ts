import * as clock from "../../../../kit/clock.js";
import { SeasonalDomainAuditEngine, defaultSeasonalDomainAuditEngine } from "./seasonal-domain-audit-engine.js";
import { SeasonalDomainAuditValidator, defaultSeasonalDomainAuditValidator } from "./seasonal-domain-audit-rules.js";
import { SeasonalDomainAuditStore } from "./seasonal-domain-audit-store.js";

/** Moves seasonal domain audits through their life cycle and keeps a journal of what it did. */
export class SeasonalDomainAuditManager {
  store: SeasonalDomainAuditStore;
  validator: SeasonalDomainAuditValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalDomainAuditEngine;

  constructor(
    store: SeasonalDomainAuditStore,
    validator: SeasonalDomainAuditValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalDomainAuditEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal domain audit ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal domain audit ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal domain audit ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newSeasonalDomainAuditManager(store: SeasonalDomainAuditStore, clockValue: clock.Clock): SeasonalDomainAuditManager {
  return new SeasonalDomainAuditManager(
    store,
    defaultSeasonalDomainAuditValidator(),
    clockValue,
    [],
    defaultSeasonalDomainAuditEngine(),
  );
}
