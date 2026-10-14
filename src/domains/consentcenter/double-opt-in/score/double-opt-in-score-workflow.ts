import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { DoubleOptInScoreEngine, defaultDoubleOptInScoreEngine } from "./double-opt-in-score-engine.js";
import { DoubleOptInScoreValidator, defaultDoubleOptInScoreValidator } from "./double-opt-in-score-rules.js";
import { DoubleOptInScoreStore } from "./double-opt-in-score-store.js";

/** Moves double opt in scores through their life cycle and keeps a journal of what it did. */
export class DoubleOptInScoreManager {
  store: DoubleOptInScoreStore;
  validator: DoubleOptInScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DoubleOptInScoreEngine;

  constructor(
    store: DoubleOptInScoreStore,
    validator: DoubleOptInScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DoubleOptInScoreEngine,
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
      throw new Error(`double opt in score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in score ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in score ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDoubleOptInScoreManager(store: DoubleOptInScoreStore, clockValue: clock.Clock, flagsValue: flags.Registry): DoubleOptInScoreManager {
  return new DoubleOptInScoreManager(
    store,
    defaultDoubleOptInScoreValidator(),
    clockValue,
    [],
    defaultDoubleOptInScoreEngine(flagsValue),
  );
}
