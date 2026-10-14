import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CappedCreditThresholdEngine, defaultCappedCreditThresholdEngine } from "./capped-credit-threshold-engine.js";
import {
  CappedCreditThresholdValidator,
  defaultCappedCreditThresholdValidator,
} from "./capped-credit-threshold-rules.js";
import { CappedCreditThresholdStore } from "./capped-credit-threshold-store.js";

/** Moves capped credit thresholds through their life cycle and keeps a journal of what it did. */
export class CappedCreditThresholdWorkflow {
  store: CappedCreditThresholdStore;
  validator: CappedCreditThresholdValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CappedCreditThresholdEngine;

  constructor(
    store: CappedCreditThresholdStore,
    validator: CappedCreditThresholdValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CappedCreditThresholdEngine,
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
      throw new Error(`capped credit threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped credit threshold ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped credit threshold ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newCappedCreditThresholdWorkflow(store: CappedCreditThresholdStore, clockValue: clock.Clock, flagsValue: flags.Registry): CappedCreditThresholdWorkflow {
  return new CappedCreditThresholdWorkflow(
    store,
    defaultCappedCreditThresholdValidator(),
    clockValue,
    [],
    defaultCappedCreditThresholdEngine(flagsValue),
  );
}
