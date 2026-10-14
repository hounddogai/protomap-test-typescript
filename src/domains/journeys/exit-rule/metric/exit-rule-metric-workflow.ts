import * as clock from "../../../../kit/clock.js";
import { ExitRuleMetricEngine, defaultExitRuleMetricEngine } from "./exit-rule-metric-engine.js";
import { ExitRuleMetricValidator, defaultExitRuleMetricValidator } from "./exit-rule-metric-rules.js";
import { ExitRuleMetricStore } from "./exit-rule-metric-store.js";

/** Moves exit rule metrics through their life cycle and keeps a journal of what it did. */
export class ExitRuleMetricManager {
  store: ExitRuleMetricStore;
  validator: ExitRuleMetricValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleMetricEngine;

  constructor(
    store: ExitRuleMetricStore,
    validator: ExitRuleMetricValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleMetricEngine,
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
      throw new Error(`exit rule metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule metric ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newExitRuleMetricManager(store: ExitRuleMetricStore, clockValue: clock.Clock): ExitRuleMetricManager {
  return new ExitRuleMetricManager(
    store,
    defaultExitRuleMetricValidator(),
    clockValue,
    [],
    defaultExitRuleMetricEngine(),
  );
}
