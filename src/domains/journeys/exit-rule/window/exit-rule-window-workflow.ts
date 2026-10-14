import * as clock from "../../../../kit/clock.js";
import { ExitRuleWindowEngine, defaultExitRuleWindowEngine } from "./exit-rule-window-engine.js";
import { ExitRuleWindowValidator, defaultExitRuleWindowValidator } from "./exit-rule-window-rules.js";
import { ExitRuleWindowStore } from "./exit-rule-window-store.js";

/** Moves exit rule windows through their life cycle and keeps a journal of what it did. */
export class ExitRuleWindowService {
  store: ExitRuleWindowStore;
  validator: ExitRuleWindowValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleWindowEngine;

  constructor(
    store: ExitRuleWindowStore,
    validator: ExitRuleWindowValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleWindowEngine,
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
      throw new Error(`exit rule window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule window ${code} not found`);
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
      throw new Error(`exit rule window ${code} not found`);
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

export function newExitRuleWindowService(store: ExitRuleWindowStore, clockValue: clock.Clock): ExitRuleWindowService {
  return new ExitRuleWindowService(
    store,
    defaultExitRuleWindowValidator(),
    clockValue,
    [],
    defaultExitRuleWindowEngine(),
  );
}
