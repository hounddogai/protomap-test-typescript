import * as clock from "../../../../kit/clock.js";
import { ExitRuleEstimateEngine, defaultExitRuleEstimateEngine } from "./exit-rule-estimate-engine.js";
import { ExitRuleEstimateValidator, defaultExitRuleEstimateValidator } from "./exit-rule-estimate-rules.js";
import { ExitRuleEstimateStore } from "./exit-rule-estimate-store.js";

/** Moves exit rule estimates through their life cycle and keeps a journal of what it did. */
export class ExitRuleEstimateWorkflow {
  store: ExitRuleEstimateStore;
  validator: ExitRuleEstimateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleEstimateEngine;

  constructor(
    store: ExitRuleEstimateStore,
    validator: ExitRuleEstimateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleEstimateEngine,
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
      throw new Error(`exit rule estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule estimate ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newExitRuleEstimateWorkflow(store: ExitRuleEstimateStore, clockValue: clock.Clock): ExitRuleEstimateWorkflow {
  return new ExitRuleEstimateWorkflow(
    store,
    defaultExitRuleEstimateValidator(),
    clockValue,
    [],
    defaultExitRuleEstimateEngine(),
  );
}
