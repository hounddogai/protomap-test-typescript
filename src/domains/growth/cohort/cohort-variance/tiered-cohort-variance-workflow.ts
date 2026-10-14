import * as clock from "../../../../kit/clock.js";
import { TieredCohortVarianceEngine, defaultTieredCohortVarianceEngine } from "./tiered-cohort-variance-engine.js";
import {
  TieredCohortVarianceValidator,
  defaultTieredCohortVarianceValidator,
} from "./tiered-cohort-variance-rules.js";
import { TieredCohortVarianceStore } from "./tiered-cohort-variance-store.js";

/** Moves tiered cohort variances through their life cycle and keeps a journal of what it did. */
export class TieredCohortVarianceManager {
  store: TieredCohortVarianceStore;
  validator: TieredCohortVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredCohortVarianceEngine;

  constructor(
    store: TieredCohortVarianceStore,
    validator: TieredCohortVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredCohortVarianceEngine,
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
      throw new Error(`tiered cohort variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered cohort variance ${code} not found`);
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
      throw new Error(`tiered cohort variance ${code} not found`);
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

export function newTieredCohortVarianceManager(store: TieredCohortVarianceStore, clockValue: clock.Clock): TieredCohortVarianceManager {
  return new TieredCohortVarianceManager(
    store,
    defaultTieredCohortVarianceValidator(),
    clockValue,
    [],
    defaultTieredCohortVarianceEngine(),
  );
}
