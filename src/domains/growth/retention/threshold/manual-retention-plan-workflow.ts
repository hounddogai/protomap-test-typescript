import * as clock from "../../../../kit/clock.js";
import { ManualRetentionPlanEngine, defaultManualRetentionPlanEngine } from "./manual-retention-plan-engine.js";
import { ManualRetentionPlanValidator, defaultManualRetentionPlanValidator } from "./manual-retention-plan-rules.js";
import { ManualRetentionPlanStore } from "./manual-retention-plan-store.js";

/** Moves manual retention plans through their life cycle and keeps a journal of what it did. */
export class ManualRetentionPlanCoordinator {
  store: ManualRetentionPlanStore;
  validator: ManualRetentionPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualRetentionPlanEngine;

  constructor(
    store: ManualRetentionPlanStore,
    validator: ManualRetentionPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualRetentionPlanEngine,
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
      throw new Error(`manual retention plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual retention plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual retention plan ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newManualRetentionPlanCoordinator(store: ManualRetentionPlanStore, clockValue: clock.Clock): ManualRetentionPlanCoordinator {
  return new ManualRetentionPlanCoordinator(
    store,
    defaultManualRetentionPlanValidator(),
    clockValue,
    [],
    defaultManualRetentionPlanEngine(),
  );
}
