import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WaitVarianceEngine, defaultWaitVarianceEngine } from "./wait-variance-engine.js";
import { WaitVarianceValidator, defaultWaitVarianceValidator } from "./wait-variance-rules.js";
import { WaitVarianceStore } from "./wait-variance-store.js";

/** Moves wait variances through their life cycle and keeps a journal of what it did. */
export class WaitVarianceManager {
  store: WaitVarianceStore;
  validator: WaitVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitVarianceEngine;

  constructor(
    store: WaitVarianceStore,
    validator: WaitVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitVarianceEngine,
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
      throw new Error(`wait variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait variance ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newWaitVarianceManager(store: WaitVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): WaitVarianceManager {
  return new WaitVarianceManager(
    store,
    defaultWaitVarianceValidator(),
    clockValue,
    [],
    defaultWaitVarianceEngine(flagsValue),
  );
}
