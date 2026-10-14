import * as clock from "../../../../kit/clock.js";
import { PayoutBatchValidator, defaultPayoutBatchValidator } from "./payout-batch-rules.js";
import { PayoutBatchStore } from "./payout-batch-store.js";

/** Moves payout batches through their life cycle and keeps a journal of what it did. */
export class PayoutBatchDesk {
  store: PayoutBatchStore;
  validator: PayoutBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PayoutBatchStore,
    validator: PayoutBatchValidator,
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
      throw new Error(`payout batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newPayoutBatchDesk(store: PayoutBatchStore, clockValue: clock.Clock): PayoutBatchDesk {
  return new PayoutBatchDesk(store, defaultPayoutBatchValidator(), clockValue, []);
}
