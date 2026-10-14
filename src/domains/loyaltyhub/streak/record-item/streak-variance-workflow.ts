import * as clock from "../../../../kit/clock.js";
import { StreakVarianceEngine, defaultStreakVarianceEngine } from "./streak-variance-engine.js";
import { StreakVarianceValidator, defaultStreakVarianceValidator } from "./streak-variance-rules.js";
import { StreakVarianceStore } from "./streak-variance-store.js";

/** Moves streak variances through their life cycle and keeps a journal of what it did. */
export class StreakVarianceService {
  store: StreakVarianceStore;
  validator: StreakVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakVarianceEngine;

  constructor(
    store: StreakVarianceStore,
    validator: StreakVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakVarianceEngine,
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
      throw new Error(`streak variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak variance ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newStreakVarianceService(store: StreakVarianceStore, clockValue: clock.Clock): StreakVarianceService {
  return new StreakVarianceService(
    store,
    defaultStreakVarianceValidator(),
    clockValue,
    [],
    defaultStreakVarianceEngine(),
  );
}
