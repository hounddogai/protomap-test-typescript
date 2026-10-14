import * as clock from "../../../../kit/clock.js";
import { ManualFraudCheckPlanEngine, defaultManualFraudCheckPlanEngine } from "./manual-fraud-check-plan-engine.js";
import {
  ManualFraudCheckPlanValidator,
  defaultManualFraudCheckPlanValidator,
} from "./manual-fraud-check-plan-rules.js";
import { ManualFraudCheckPlanStore } from "./manual-fraud-check-plan-store.js";

/** Moves manual fraud check plans through their life cycle and keeps a journal of what it did. */
export class ManualFraudCheckPlanService {
  store: ManualFraudCheckPlanStore;
  validator: ManualFraudCheckPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ManualFraudCheckPlanEngine;

  constructor(
    store: ManualFraudCheckPlanStore,
    validator: ManualFraudCheckPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ManualFraudCheckPlanEngine,
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
      throw new Error(`manual fraud check plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual fraud check plan ${code} not found`);
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
      throw new Error(`manual fraud check plan ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newManualFraudCheckPlanService(store: ManualFraudCheckPlanStore, clockValue: clock.Clock): ManualFraudCheckPlanService {
  return new ManualFraudCheckPlanService(
    store,
    defaultManualFraudCheckPlanValidator(),
    clockValue,
    [],
    defaultManualFraudCheckPlanEngine(),
  );
}
