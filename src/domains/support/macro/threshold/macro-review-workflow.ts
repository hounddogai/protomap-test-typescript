import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { MacroReviewEngine, defaultMacroReviewEngine } from "./macro-review-engine.js";
import { MacroReviewValidator, defaultMacroReviewValidator } from "./macro-review-rules.js";
import { MacroReviewStore } from "./macro-review-store.js";

/** Moves macro reviews through their life cycle and keeps a journal of what it did. */
export class MacroReviewWorkflow {
  store: MacroReviewStore;
  validator: MacroReviewValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MacroReviewEngine;

  constructor(
    store: MacroReviewStore,
    validator: MacroReviewValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MacroReviewEngine,
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
      throw new Error(`macro review ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro review ${code} not found`);
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
      throw new Error(`macro review ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newMacroReviewWorkflow(store: MacroReviewStore, clockValue: clock.Clock, flagsValue: flags.Registry): MacroReviewWorkflow {
  return new MacroReviewWorkflow(
    store,
    defaultMacroReviewValidator(),
    clockValue,
    [],
    defaultMacroReviewEngine(flagsValue),
  );
}
