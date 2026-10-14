import * as clock from "../../../../kit/clock.js";
import { DeflectionVarianceEngine, defaultDeflectionVarianceEngine } from "./deflection-variance-engine.js";
import { DeflectionVarianceValidator, defaultDeflectionVarianceValidator } from "./deflection-variance-rules.js";
import { DeflectionVarianceStore } from "./deflection-variance-store.js";

/** Moves deflection variances through their life cycle and keeps a journal of what it did. */
export class DeflectionVarianceManager {
  store: DeflectionVarianceStore;
  validator: DeflectionVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DeflectionVarianceEngine;

  constructor(
    store: DeflectionVarianceStore,
    validator: DeflectionVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DeflectionVarianceEngine,
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
      throw new Error(`deflection variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`deflection variance ${code} not found`);
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
      throw new Error(`deflection variance ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDeflectionVarianceManager(store: DeflectionVarianceStore, clockValue: clock.Clock): DeflectionVarianceManager {
  return new DeflectionVarianceManager(
    store,
    defaultDeflectionVarianceValidator(),
    clockValue,
    [],
    defaultDeflectionVarianceEngine(),
  );
}
