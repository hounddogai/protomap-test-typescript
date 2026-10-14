import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DeflectionTemplateEngine, defaultDeflectionTemplateEngine } from "./deflection-template-engine.js";
import { DeflectionTemplateValidator, defaultDeflectionTemplateValidator } from "./deflection-template-rules.js";
import { DeflectionTemplateStore } from "./deflection-template-store.js";

/** Moves deflection templates through their life cycle and keeps a journal of what it did. */
export class DeflectionTemplateWorkflow {
  store: DeflectionTemplateStore;
  validator: DeflectionTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DeflectionTemplateEngine;

  constructor(
    store: DeflectionTemplateStore,
    validator: DeflectionTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DeflectionTemplateEngine,
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
      throw new Error(`deflection template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection template ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newDeflectionTemplateWorkflow(store: DeflectionTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): DeflectionTemplateWorkflow {
  return new DeflectionTemplateWorkflow(
    store,
    defaultDeflectionTemplateValidator(),
    clockValue,
    [],
    defaultDeflectionTemplateEngine(flagsValue),
  );
}
