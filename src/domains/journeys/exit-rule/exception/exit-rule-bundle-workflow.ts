import * as clock from "../../../../kit/clock.js";
import { ExitRuleBundleEngine, defaultExitRuleBundleEngine } from "./exit-rule-bundle-engine.js";
import { ExitRuleBundleValidator, defaultExitRuleBundleValidator } from "./exit-rule-bundle-rules.js";
import { ExitRuleBundleStore } from "./exit-rule-bundle-store.js";

/** Moves exit rule bundles through their life cycle and keeps a journal of what it did. */
export class ExitRuleBundleWorkflow {
  store: ExitRuleBundleStore;
  validator: ExitRuleBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleBundleEngine;

  constructor(
    store: ExitRuleBundleStore,
    validator: ExitRuleBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleBundleEngine,
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
      throw new Error(`exit rule bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule bundle ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newExitRuleBundleWorkflow(store: ExitRuleBundleStore, clockValue: clock.Clock): ExitRuleBundleWorkflow {
  return new ExitRuleBundleWorkflow(
    store,
    defaultExitRuleBundleValidator(),
    clockValue,
    [],
    defaultExitRuleBundleEngine(),
  );
}
