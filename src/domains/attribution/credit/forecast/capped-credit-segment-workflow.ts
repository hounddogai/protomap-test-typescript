import * as clock from "../../../../kit/clock.js";
import { CappedCreditSegmentEngine, defaultCappedCreditSegmentEngine } from "./capped-credit-segment-engine.js";
import { CappedCreditSegmentValidator, defaultCappedCreditSegmentValidator } from "./capped-credit-segment-rules.js";
import { CappedCreditSegmentStore } from "./capped-credit-segment-store.js";

/** Moves capped credit segments through their life cycle and keeps a journal of what it did. */
export class CappedCreditSegmentWorkflow {
  store: CappedCreditSegmentStore;
  validator: CappedCreditSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedCreditSegmentEngine;

  constructor(
    store: CappedCreditSegmentStore,
    validator: CappedCreditSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedCreditSegmentEngine,
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
      throw new Error(`capped credit segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped credit segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped credit segment ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newCappedCreditSegmentWorkflow(store: CappedCreditSegmentStore, clockValue: clock.Clock): CappedCreditSegmentWorkflow {
  return new CappedCreditSegmentWorkflow(
    store,
    defaultCappedCreditSegmentValidator(),
    clockValue,
    [],
    defaultCappedCreditSegmentEngine(),
  );
}
