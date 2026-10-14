import * as clock from "../../../../kit/clock.js";
import { ExitRuleBaselineEngine, defaultExitRuleBaselineEngine } from "./exit-rule-baseline-engine.js";
import { ExitRuleBaselineValidator, defaultExitRuleBaselineValidator } from "./exit-rule-baseline-rules.js";
import { ExitRuleBaselineStore } from "./exit-rule-baseline-store.js";

/** Moves exit rule baselines through their life cycle and keeps a journal of what it did. */
export class ExitRuleBaselineCoordinator {
  store: ExitRuleBaselineStore;
  validator: ExitRuleBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleBaselineEngine;

  constructor(
    store: ExitRuleBaselineStore,
    validator: ExitRuleBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleBaselineEngine,
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
      throw new Error(`exit rule baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule baseline ${code} not found`);
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
      throw new Error(`exit rule baseline ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newExitRuleBaselineCoordinator(store: ExitRuleBaselineStore, clockValue: clock.Clock): ExitRuleBaselineCoordinator {
  return new ExitRuleBaselineCoordinator(
    store,
    defaultExitRuleBaselineValidator(),
    clockValue,
    [],
    defaultExitRuleBaselineEngine(),
  );
}
