import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CsatTemplateEngine, defaultCsatTemplateEngine } from "./csat-template-engine.js";
import { CsatTemplateValidator, defaultCsatTemplateValidator } from "./csat-template-rules.js";
import { CsatTemplateStore } from "./csat-template-store.js";

/** Moves csat templates through their life cycle and keeps a journal of what it did. */
export class CsatTemplateWorkflow {
  store: CsatTemplateStore;
  validator: CsatTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatTemplateEngine;

  constructor(
    store: CsatTemplateStore,
    validator: CsatTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatTemplateEngine,
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
      throw new Error(`csat template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat template ${code} not found`);
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

export function newCsatTemplateWorkflow(store: CsatTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): CsatTemplateWorkflow {
  return new CsatTemplateWorkflow(
    store,
    defaultCsatTemplateValidator(),
    clockValue,
    [],
    defaultCsatTemplateEngine(flagsValue),
  );
}
