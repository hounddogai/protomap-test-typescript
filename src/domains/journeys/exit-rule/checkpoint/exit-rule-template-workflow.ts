import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ExitRuleTemplateEngine, defaultExitRuleTemplateEngine } from "./exit-rule-template-engine.js";
import { ExitRuleTemplateValidator, defaultExitRuleTemplateValidator } from "./exit-rule-template-rules.js";
import { ExitRuleTemplateStore } from "./exit-rule-template-store.js";

/** Moves exit rule templates through their life cycle and keeps a journal of what it did. */
export class ExitRuleTemplateWorkflow {
  store: ExitRuleTemplateStore;
  validator: ExitRuleTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleTemplateEngine;

  constructor(
    store: ExitRuleTemplateStore,
    validator: ExitRuleTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleTemplateEngine,
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
      throw new Error(`exit rule template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule template ${code} not found`);
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

export function newExitRuleTemplateWorkflow(store: ExitRuleTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): ExitRuleTemplateWorkflow {
  return new ExitRuleTemplateWorkflow(
    store,
    defaultExitRuleTemplateValidator(),
    clockValue,
    [],
    defaultExitRuleTemplateEngine(flagsValue),
  );
}
