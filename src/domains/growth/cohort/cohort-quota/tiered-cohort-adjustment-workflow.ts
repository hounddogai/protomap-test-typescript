import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredCohortAdjustmentEngine,
  defaultTieredCohortAdjustmentEngine,
} from "./tiered-cohort-adjustment-engine.js";
import {
  TieredCohortAdjustmentValidator,
  defaultTieredCohortAdjustmentValidator,
} from "./tiered-cohort-adjustment-rules.js";
import { TieredCohortAdjustmentStore } from "./tiered-cohort-adjustment-store.js";

/** Moves tiered cohort adjustments through their life cycle and keeps a journal of what it did. */
export class TieredCohortAdjustmentService {
  store: TieredCohortAdjustmentStore;
  validator: TieredCohortAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredCohortAdjustmentEngine;

  constructor(
    store: TieredCohortAdjustmentStore,
    validator: TieredCohortAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredCohortAdjustmentEngine,
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
      throw new Error(`tiered cohort adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered cohort adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered cohort adjustment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredCohortAdjustmentService(store: TieredCohortAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredCohortAdjustmentService {
  return new TieredCohortAdjustmentService(
    store,
    defaultTieredCohortAdjustmentValidator(),
    clockValue,
    [],
    defaultTieredCohortAdjustmentEngine(flagsValue),
  );
}
