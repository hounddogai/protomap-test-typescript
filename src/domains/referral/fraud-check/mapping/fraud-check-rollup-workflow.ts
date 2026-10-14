import * as clock from "../../../../kit/clock.js";
import { FraudCheckRollupValidator, defaultFraudCheckRollupValidator } from "./fraud-check-rollup-rules.js";
import { FraudCheckRollupStore } from "./fraud-check-rollup-store.js";

/** Moves fraud check rollups through their life cycle and keeps a journal of what it did. */
export class FraudCheckRollupManager {
  store: FraudCheckRollupStore;
  validator: FraudCheckRollupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FraudCheckRollupStore,
    validator: FraudCheckRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newFraudCheckRollupManager(store: FraudCheckRollupStore, clockValue: clock.Clock): FraudCheckRollupManager {
  return new FraudCheckRollupManager(store, defaultFraudCheckRollupValidator(), clockValue, []);
}
