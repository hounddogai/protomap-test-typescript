import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ExitRuleProfileEngine, defaultExitRuleProfileEngine } from "./exit-rule-profile-engine.js";
import { ExitRuleProfileValidator, defaultExitRuleProfileValidator } from "./exit-rule-profile-rules.js";
import { ExitRuleProfileStore } from "./exit-rule-profile-store.js";

/** Moves exit rule profiles through their life cycle and keeps a journal of what it did. */
export class ExitRuleProfileManager {
  store: ExitRuleProfileStore;
  validator: ExitRuleProfileValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleProfileEngine;

  constructor(
    store: ExitRuleProfileStore,
    validator: ExitRuleProfileValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleProfileEngine,
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
      throw new Error(`exit rule profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule profile ${code} not found`);
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

export function newExitRuleProfileManager(store: ExitRuleProfileStore, clockValue: clock.Clock, flagsValue: flags.Registry): ExitRuleProfileManager {
  return new ExitRuleProfileManager(
    store,
    defaultExitRuleProfileValidator(),
    clockValue,
    [],
    defaultExitRuleProfileEngine(flagsValue),
  );
}
