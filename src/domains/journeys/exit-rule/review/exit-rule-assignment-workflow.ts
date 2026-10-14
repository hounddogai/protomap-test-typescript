import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ExitRuleAssignmentEngine, defaultExitRuleAssignmentEngine } from "./exit-rule-assignment-engine.js";
import { ExitRuleAssignmentValidator, defaultExitRuleAssignmentValidator } from "./exit-rule-assignment-rules.js";
import { ExitRuleAssignmentStore } from "./exit-rule-assignment-store.js";

/** Moves exit rule assignments through their life cycle and keeps a journal of what it did. */
export class ExitRuleAssignmentManager {
  store: ExitRuleAssignmentStore;
  validator: ExitRuleAssignmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleAssignmentEngine;

  constructor(
    store: ExitRuleAssignmentStore,
    validator: ExitRuleAssignmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleAssignmentEngine,
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
      throw new Error(`exit rule assignment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule assignment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule assignment ${code} not found`);
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

export function newExitRuleAssignmentManager(store: ExitRuleAssignmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): ExitRuleAssignmentManager {
  return new ExitRuleAssignmentManager(
    store,
    defaultExitRuleAssignmentValidator(),
    clockValue,
    [],
    defaultExitRuleAssignmentEngine(flagsValue),
  );
}
