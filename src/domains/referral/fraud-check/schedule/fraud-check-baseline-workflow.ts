import * as clock from "../../../../kit/clock.js";
import { FraudCheckBaselineValidator, defaultFraudCheckBaselineValidator } from "./fraud-check-baseline-rules.js";
import { FraudCheckBaselineStore } from "./fraud-check-baseline-store.js";

/** Moves fraud check baselines through their life cycle and keeps a journal of what it did. */
export class FraudCheckBaselineWorkflow {
  store: FraudCheckBaselineStore;
  validator: FraudCheckBaselineValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FraudCheckBaselineStore,
    validator: FraudCheckBaselineValidator,
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

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fraud check baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newFraudCheckBaselineWorkflow(store: FraudCheckBaselineStore, clockValue: clock.Clock): FraudCheckBaselineWorkflow {
  return new FraudCheckBaselineWorkflow(store, defaultFraudCheckBaselineValidator(), clockValue, []);
}
