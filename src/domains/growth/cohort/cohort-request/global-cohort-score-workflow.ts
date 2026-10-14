import * as clock from "../../../../kit/clock.js";
import { GlobalCohortScoreEngine, defaultGlobalCohortScoreEngine } from "./global-cohort-score-engine.js";
import { GlobalCohortScoreValidator, defaultGlobalCohortScoreValidator } from "./global-cohort-score-rules.js";
import { GlobalCohortScoreStore } from "./global-cohort-score-store.js";

/** Moves global cohort scores through their life cycle and keeps a journal of what it did. */
export class GlobalCohortScoreManager {
  store: GlobalCohortScoreStore;
  validator: GlobalCohortScoreValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalCohortScoreEngine;

  constructor(
    store: GlobalCohortScoreStore,
    validator: GlobalCohortScoreValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalCohortScoreEngine,
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
      throw new Error(`global cohort score ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global cohort score ${code} not found`);
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
      throw new Error(`global cohort score ${code} not found`);
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

export function newGlobalCohortScoreManager(store: GlobalCohortScoreStore, clockValue: clock.Clock): GlobalCohortScoreManager {
  return new GlobalCohortScoreManager(
    store,
    defaultGlobalCohortScoreValidator(),
    clockValue,
    [],
    defaultGlobalCohortScoreEngine(),
  );
}
