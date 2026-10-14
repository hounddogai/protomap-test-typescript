import * as clock from "../../../../kit/clock.js";
import {
  WeightedFraudCheckExceptionValidator,
  defaultWeightedFraudCheckExceptionValidator,
} from "./weighted-fraud-check-exception-rules.js";
import { WeightedFraudCheckExceptionStore } from "./weighted-fraud-check-exception-store.js";

/** Moves weighted fraud check exceptions through their life cycle and keeps a journal of what it did. */
export class WeightedFraudCheckExceptionWorkflow {
  store: WeightedFraudCheckExceptionStore;
  validator: WeightedFraudCheckExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedFraudCheckExceptionStore,
    validator: WeightedFraudCheckExceptionValidator,
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
      throw new Error(`weighted fraud check exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted fraud check exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newWeightedFraudCheckExceptionWorkflow(store: WeightedFraudCheckExceptionStore, clockValue: clock.Clock): WeightedFraudCheckExceptionWorkflow {
  return new WeightedFraudCheckExceptionWorkflow(store, defaultWeightedFraudCheckExceptionValidator(), clockValue, []);
}
