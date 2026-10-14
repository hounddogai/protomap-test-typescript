import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveFraudCheckSummaryValidator,
  defaultAdaptiveFraudCheckSummaryValidator,
} from "./adaptive-fraud-check-summary-rules.js";
import { AdaptiveFraudCheckSummaryStore } from "./adaptive-fraud-check-summary-store.js";

/** Moves adaptive fraud check summaries through their life cycle and keeps a journal of what it did. */
export class AdaptiveFraudCheckSummaryWorkflow {
  store: AdaptiveFraudCheckSummaryStore;
  validator: AdaptiveFraudCheckSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveFraudCheckSummaryStore,
    validator: AdaptiveFraudCheckSummaryValidator,
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
      throw new Error(`adaptive fraud check summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive fraud check summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newAdaptiveFraudCheckSummaryWorkflow(store: AdaptiveFraudCheckSummaryStore, clockValue: clock.Clock): AdaptiveFraudCheckSummaryWorkflow {
  return new AdaptiveFraudCheckSummaryWorkflow(store, defaultAdaptiveFraudCheckSummaryValidator(), clockValue, []);
}
