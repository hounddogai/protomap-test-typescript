import * as clock from "../../../../kit/clock.js";
import {
  FallbackBidRuleAdjustmentValidator,
  defaultFallbackBidRuleAdjustmentValidator,
} from "./fallback-bid-rule-adjustment-rules.js";
import { FallbackBidRuleAdjustmentStore } from "./fallback-bid-rule-adjustment-store.js";

/** Moves fallback bid rule adjustments through their life cycle and keeps a journal of what it did. */
export class FallbackBidRuleAdjustmentDesk {
  store: FallbackBidRuleAdjustmentStore;
  validator: FallbackBidRuleAdjustmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FallbackBidRuleAdjustmentStore,
    validator: FallbackBidRuleAdjustmentValidator,
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
      throw new Error(`fallback bid rule adjustment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback bid rule adjustment ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackBidRuleAdjustmentDesk(store: FallbackBidRuleAdjustmentStore, clockValue: clock.Clock): FallbackBidRuleAdjustmentDesk {
  return new FallbackBidRuleAdjustmentDesk(store, defaultFallbackBidRuleAdjustmentValidator(), clockValue, []);
}
