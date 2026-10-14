import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { InsightTemplateEngine, defaultInsightTemplateEngine } from "./insight-template-engine.js";
import { InsightTemplateValidator, defaultInsightTemplateValidator } from "./insight-template-rules.js";
import { InsightTemplateStore } from "./insight-template-store.js";

/** Moves insight templates through their life cycle and keeps a journal of what it did. */
export class InsightTemplateWorkflow {
  store: InsightTemplateStore;
  validator: InsightTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: InsightTemplateEngine;

  constructor(
    store: InsightTemplateStore,
    validator: InsightTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: InsightTemplateEngine,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight template ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newInsightTemplateWorkflow(store: InsightTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): InsightTemplateWorkflow {
  return new InsightTemplateWorkflow(
    store,
    defaultInsightTemplateValidator(),
    clockValue,
    [],
    defaultInsightTemplateEngine(flagsValue),
  );
}
