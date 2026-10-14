import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LegacyCsatQuotaEngine, defaultLegacyCsatQuotaEngine } from "./legacy-csat-quota-engine.js";
import { LegacyCsatQuotaValidator, defaultLegacyCsatQuotaValidator } from "./legacy-csat-quota-rules.js";
import { LegacyCsatQuotaStore } from "./legacy-csat-quota-store.js";

/** Moves legacy csat quotas through their life cycle and keeps a journal of what it did. */
export class LegacyCsatQuotaCoordinator {
  store: LegacyCsatQuotaStore;
  validator: LegacyCsatQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LegacyCsatQuotaEngine;

  constructor(
    store: LegacyCsatQuotaStore,
    validator: LegacyCsatQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LegacyCsatQuotaEngine,
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
      throw new Error(`legacy csat quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy csat quota ${code} not found`);
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
      throw new Error(`legacy csat quota ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newLegacyCsatQuotaCoordinator(store: LegacyCsatQuotaStore, clockValue: clock.Clock, flagsValue: flags.Registry): LegacyCsatQuotaCoordinator {
  return new LegacyCsatQuotaCoordinator(
    store,
    defaultLegacyCsatQuotaValidator(),
    clockValue,
    [],
    defaultLegacyCsatQuotaEngine(flagsValue),
  );
}
