import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CreditSegmentEngine, defaultCreditSegmentEngine } from "./credit-segment-engine.js";
import { CreditSegmentValidator, defaultCreditSegmentValidator } from "./credit-segment-rules.js";
import { CreditSegmentStore } from "./credit-segment-store.js";

/** Moves credit segments through their life cycle and keeps a journal of what it did. */
export class CreditSegmentWorkflow {
  store: CreditSegmentStore;
  validator: CreditSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CreditSegmentEngine;

  constructor(
    store: CreditSegmentStore,
    validator: CreditSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CreditSegmentEngine,
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
      throw new Error(`credit segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`credit segment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newCreditSegmentWorkflow(store: CreditSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): CreditSegmentWorkflow {
  return new CreditSegmentWorkflow(
    store,
    defaultCreditSegmentValidator(),
    clockValue,
    [],
    defaultCreditSegmentEngine(flagsValue),
  );
}
