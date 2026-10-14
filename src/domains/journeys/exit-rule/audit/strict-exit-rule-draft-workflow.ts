import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StrictExitRuleDraftEngine, defaultStrictExitRuleDraftEngine } from "./strict-exit-rule-draft-engine.js";
import { StrictExitRuleDraftValidator, defaultStrictExitRuleDraftValidator } from "./strict-exit-rule-draft-rules.js";
import { StrictExitRuleDraftStore } from "./strict-exit-rule-draft-store.js";

/** Moves strict exit rule drafts through their life cycle and keeps a journal of what it did. */
export class StrictExitRuleDraftWorkflow {
  store: StrictExitRuleDraftStore;
  validator: StrictExitRuleDraftValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictExitRuleDraftEngine;

  constructor(
    store: StrictExitRuleDraftStore,
    validator: StrictExitRuleDraftValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictExitRuleDraftEngine,
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
      throw new Error(`strict exit rule draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict exit rule draft ${code} not found`);
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
      throw new Error(`strict exit rule draft ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newStrictExitRuleDraftWorkflow(store: StrictExitRuleDraftStore, clockValue: clock.Clock, flagsValue: flags.Registry): StrictExitRuleDraftWorkflow {
  return new StrictExitRuleDraftWorkflow(
    store,
    defaultStrictExitRuleDraftValidator(),
    clockValue,
    [],
    defaultStrictExitRuleDraftEngine(flagsValue),
  );
}
