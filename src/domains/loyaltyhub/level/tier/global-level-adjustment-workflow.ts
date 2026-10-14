import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalLevelAdjustmentEngine, defaultGlobalLevelAdjustmentEngine } from "./global-level-adjustment-engine.js";
import {
  GlobalLevelAdjustmentValidator,
  defaultGlobalLevelAdjustmentValidator,
} from "./global-level-adjustment-rules.js";
import { GlobalLevelAdjustmentStore } from "./global-level-adjustment-store.js";

/** Moves global level adjustments through their life cycle and keeps a journal of what it did. */
export class GlobalLevelAdjustmentWorkflow {
  store: GlobalLevelAdjustmentStore;
  validator: GlobalLevelAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalLevelAdjustmentEngine;

  constructor(
    store: GlobalLevelAdjustmentStore,
    validator: GlobalLevelAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalLevelAdjustmentEngine,
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
      throw new Error(`global level adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global level adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global level adjustment ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newGlobalLevelAdjustmentWorkflow(store: GlobalLevelAdjustmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalLevelAdjustmentWorkflow {
  return new GlobalLevelAdjustmentWorkflow(
    store,
    defaultGlobalLevelAdjustmentValidator(),
    clockValue,
    [],
    defaultGlobalLevelAdjustmentEngine(flagsValue),
  );
}
