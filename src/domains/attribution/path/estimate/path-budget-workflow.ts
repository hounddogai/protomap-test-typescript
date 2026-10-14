import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PathBudgetEngine, defaultPathBudgetEngine } from "./path-budget-engine.js";
import { PathBudgetValidator, defaultPathBudgetValidator } from "./path-budget-rules.js";
import { PathBudgetStore } from "./path-budget-store.js";

/** Moves path budgets through their life cycle and keeps a journal of what it did. */
export class PathBudgetManager {
  store: PathBudgetStore;
  validator: PathBudgetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PathBudgetEngine;

  constructor(
    store: PathBudgetStore,
    validator: PathBudgetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PathBudgetEngine,
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
      throw new Error(`path budget ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path budget ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path budget ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPathBudgetManager(store: PathBudgetStore, clockValue: clock.Clock, flagsValue: flags.Registry): PathBudgetManager {
  return new PathBudgetManager(
    store,
    defaultPathBudgetValidator(),
    clockValue,
    [],
    defaultPathBudgetEngine(flagsValue),
  );
}
