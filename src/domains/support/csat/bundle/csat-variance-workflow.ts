import * as clock from "../../../../kit/clock.js";
import { CsatVarianceEngine, defaultCsatVarianceEngine } from "./csat-variance-engine.js";
import { CsatVarianceValidator, defaultCsatVarianceValidator } from "./csat-variance-rules.js";
import { CsatVarianceStore } from "./csat-variance-store.js";

/** Moves csat variances through their life cycle and keeps a journal of what it did. */
export class CsatVarianceCoordinator {
  store: CsatVarianceStore;
  validator: CsatVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatVarianceEngine;

  constructor(
    store: CsatVarianceStore,
    validator: CsatVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatVarianceEngine,
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
      throw new Error(`csat variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat variance ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCsatVarianceCoordinator(store: CsatVarianceStore, clockValue: clock.Clock): CsatVarianceCoordinator {
  return new CsatVarianceCoordinator(
    store,
    defaultCsatVarianceValidator(),
    clockValue,
    [],
    defaultCsatVarianceEngine(),
  );
}
