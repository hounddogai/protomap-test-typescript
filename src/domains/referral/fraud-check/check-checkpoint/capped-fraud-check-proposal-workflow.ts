import * as clock from "../../../../kit/clock.js";
import {
  CappedFraudCheckProposalValidator,
  defaultCappedFraudCheckProposalValidator,
} from "./capped-fraud-check-proposal-rules.js";
import { CappedFraudCheckProposalStore } from "./capped-fraud-check-proposal-store.js";

/** Moves capped fraud check proposals through their life cycle and keeps a journal of what it did. */
export class CappedFraudCheckProposalWorkflow {
  store: CappedFraudCheckProposalStore;
  validator: CappedFraudCheckProposalValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedFraudCheckProposalStore,
    validator: CappedFraudCheckProposalValidator,
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
      throw new Error(`capped fraud check proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped fraud check proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newCappedFraudCheckProposalWorkflow(store: CappedFraudCheckProposalStore, clockValue: clock.Clock): CappedFraudCheckProposalWorkflow {
  return new CappedFraudCheckProposalWorkflow(store, defaultCappedFraudCheckProposalValidator(), clockValue, []);
}
