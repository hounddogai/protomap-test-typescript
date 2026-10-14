import * as clock from "../../../../kit/clock.js";
import { PayoutEstimateValidator, defaultPayoutEstimateValidator } from "./payout-estimate-rules.js";
import { PayoutEstimateStore } from "./payout-estimate-store.js";

/** Moves payout estimates through their life cycle and keeps a journal of what it did. */
export class PayoutEstimateWorkflow {
  store: PayoutEstimateStore;
  validator: PayoutEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PayoutEstimateStore,
    validator: PayoutEstimateValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`payout estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newPayoutEstimateWorkflow(store: PayoutEstimateStore, clockValue: clock.Clock): PayoutEstimateWorkflow {
  return new PayoutEstimateWorkflow(store, defaultPayoutEstimateValidator(), clockValue, []);
}
