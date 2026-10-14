import * as clock from "../../../../kit/clock.js";
import {
  GlobalFraudCheckSummaryValidator,
  defaultGlobalFraudCheckSummaryValidator,
} from "./global-fraud-check-summary-rules.js";
import { GlobalFraudCheckSummaryStore } from "./global-fraud-check-summary-store.js";

/** Moves global fraud check summaries through their life cycle and keeps a journal of what it did. */
export class GlobalFraudCheckSummaryWorkflow {
  store: GlobalFraudCheckSummaryStore;
  validator: GlobalFraudCheckSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalFraudCheckSummaryStore,
    validator: GlobalFraudCheckSummaryValidator,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global fraud check summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global fraud check summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newGlobalFraudCheckSummaryWorkflow(store: GlobalFraudCheckSummaryStore, clockValue: clock.Clock): GlobalFraudCheckSummaryWorkflow {
  return new GlobalFraudCheckSummaryWorkflow(store, defaultGlobalFraudCheckSummaryValidator(), clockValue, []);
}
