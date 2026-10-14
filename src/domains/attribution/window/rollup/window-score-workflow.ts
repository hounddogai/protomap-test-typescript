import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WindowScoreEngine, defaultWindowScoreEngine } from "./window-score-engine.js";
import { WindowScoreValidator, defaultWindowScoreValidator } from "./window-score-rules.js";
import { WindowScoreStore } from "./window-score-store.js";

/** Moves window scores through their life cycle and keeps a journal of what it did. */
export class WindowScoreManager {
  store: WindowScoreStore;
  validator: WindowScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WindowScoreEngine;

  constructor(
    store: WindowScoreStore,
    validator: WindowScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WindowScoreEngine,
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
      throw new Error(`window score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`window score ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newWindowScoreManager(store: WindowScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): WindowScoreManager {
  return new WindowScoreManager(
    store,
    defaultWindowScoreValidator(),
    clockValue,
    [],
    defaultWindowScoreEngine(flagsValue),
  );
}
