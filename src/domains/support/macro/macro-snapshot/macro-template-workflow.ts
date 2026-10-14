import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { MacroTemplateEngine, defaultMacroTemplateEngine } from "./macro-template-engine.js";
import { MacroTemplateValidator, defaultMacroTemplateValidator } from "./macro-template-rules.js";
import { MacroTemplateStore } from "./macro-template-store.js";

/** Moves macro templates through their life cycle and keeps a journal of what it did. */
export class MacroTemplateCoordinator {
  store: MacroTemplateStore;
  validator: MacroTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: MacroTemplateEngine;

  constructor(
    store: MacroTemplateStore,
    validator: MacroTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: MacroTemplateEngine,
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
      throw new Error(`macro template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro template ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`macro template ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newMacroTemplateCoordinator(store: MacroTemplateStore, clockValue: clock.Clock, flagsValue: flags.Registry): MacroTemplateCoordinator {
  return new MacroTemplateCoordinator(
    store,
    defaultMacroTemplateValidator(),
    clockValue,
    [],
    defaultMacroTemplateEngine(flagsValue),
  );
}
