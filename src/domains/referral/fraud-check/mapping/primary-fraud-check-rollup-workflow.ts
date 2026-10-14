import * as clock from "../../../../kit/clock.js";
import {
  PrimaryFraudCheckRollupEngine,
  defaultPrimaryFraudCheckRollupEngine,
} from "./primary-fraud-check-rollup-engine.js";
import {
  PrimaryFraudCheckRollupValidator,
  defaultPrimaryFraudCheckRollupValidator,
} from "./primary-fraud-check-rollup-rules.js";
import { PrimaryFraudCheckRollupStore } from "./primary-fraud-check-rollup-store.js";

/** Moves primary fraud check rollups through their life cycle and keeps a journal of what it did. */
export class PrimaryFraudCheckRollupWorkflow {
  store: PrimaryFraudCheckRollupStore;
  validator: PrimaryFraudCheckRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryFraudCheckRollupEngine;

  constructor(
    store: PrimaryFraudCheckRollupStore,
    validator: PrimaryFraudCheckRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryFraudCheckRollupEngine,
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
      throw new Error(`primary fraud check rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary fraud check rollup ${code} not found`);
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
      throw new Error(`primary fraud check rollup ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newPrimaryFraudCheckRollupWorkflow(store: PrimaryFraudCheckRollupStore, clockValue: clock.Clock): PrimaryFraudCheckRollupWorkflow {
  return new PrimaryFraudCheckRollupWorkflow(
    store,
    defaultPrimaryFraudCheckRollupValidator(),
    clockValue,
    [],
    defaultPrimaryFraudCheckRollupEngine(),
  );
}
