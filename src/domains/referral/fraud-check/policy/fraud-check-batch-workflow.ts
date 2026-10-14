import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FraudCheckBatchEngine, defaultFraudCheckBatchEngine } from "./fraud-check-batch-engine.js";
import { FraudCheckBatchValidator, defaultFraudCheckBatchValidator } from "./fraud-check-batch-rules.js";
import { FraudCheckBatchStore } from "./fraud-check-batch-store.js";

/** Moves fraud check batches through their life cycle and keeps a journal of what it did. */
export class FraudCheckBatchManager {
  store: FraudCheckBatchStore;
  validator: FraudCheckBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FraudCheckBatchEngine;

  constructor(
    store: FraudCheckBatchStore,
    validator: FraudCheckBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FraudCheckBatchEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check batch ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newFraudCheckBatchManager(store: FraudCheckBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): FraudCheckBatchManager {
  return new FraudCheckBatchManager(
    store,
    defaultFraudCheckBatchValidator(),
    clockValue,
    [],
    defaultFraudCheckBatchEngine(flagsValue),
  );
}
