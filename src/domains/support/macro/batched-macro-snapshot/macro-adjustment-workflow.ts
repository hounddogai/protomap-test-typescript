import * as clock from "../../../../kit/clock.js";
import { MacroAdjustmentEngine, defaultMacroAdjustmentEngine } from "./macro-adjustment-engine.js";
import { MacroAdjustmentValidator, defaultMacroAdjustmentValidator } from "./macro-adjustment-rules.js";
import { MacroAdjustmentStore } from "./macro-adjustment-store.js";

/** Moves macro adjustments through their life cycle and keeps a journal of what it did. */
export class MacroAdjustmentService {
  store: MacroAdjustmentStore;
  validator: MacroAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MacroAdjustmentEngine;

  constructor(
    store: MacroAdjustmentStore,
    validator: MacroAdjustmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MacroAdjustmentEngine,
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
      throw new Error(`macro adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro adjustment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro adjustment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newMacroAdjustmentService(store: MacroAdjustmentStore, clockValue: clock.Clock): MacroAdjustmentService {
  return new MacroAdjustmentService(
    store,
    defaultMacroAdjustmentValidator(),
    clockValue,
    [],
    defaultMacroAdjustmentEngine(),
  );
}
