import * as clock from "../../../../kit/clock.js";
import { StrictCsatQuotaEngine, defaultStrictCsatQuotaEngine } from "./strict-csat-quota-engine.js";
import { StrictCsatQuotaValidator, defaultStrictCsatQuotaValidator } from "./strict-csat-quota-rules.js";
import { StrictCsatQuotaStore } from "./strict-csat-quota-store.js";

/** Moves strict csat quotas through their life cycle and keeps a journal of what it did. */
export class StrictCsatQuotaManager {
  store: StrictCsatQuotaStore;
  validator: StrictCsatQuotaValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictCsatQuotaEngine;

  constructor(
    store: StrictCsatQuotaStore,
    validator: StrictCsatQuotaValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictCsatQuotaEngine,
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
      throw new Error(`strict csat quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict csat quota ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict csat quota ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newStrictCsatQuotaManager(store: StrictCsatQuotaStore, clockValue: clock.Clock): StrictCsatQuotaManager {
  return new StrictCsatQuotaManager(
    store,
    defaultStrictCsatQuotaValidator(),
    clockValue,
    [],
    defaultStrictCsatQuotaEngine(),
  );
}
