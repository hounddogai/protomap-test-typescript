import * as clock from "../../../../kit/clock.js";
import {
  TieredRedemptionBatchValidator,
  defaultTieredRedemptionBatchValidator,
} from "./tiered-redemption-batch-rules.js";
import { TieredRedemptionBatchStore } from "./tiered-redemption-batch-store.js";

/** Moves tiered redemption batches through their life cycle and keeps a journal of what it did. */
export class TieredRedemptionBatchManager {
  store: TieredRedemptionBatchStore;
  validator: TieredRedemptionBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredRedemptionBatchStore,
    validator: TieredRedemptionBatchValidator,
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
      throw new Error(`tiered redemption batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered redemption batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredRedemptionBatchManager(store: TieredRedemptionBatchStore, clockValue: clock.Clock): TieredRedemptionBatchManager {
  return new TieredRedemptionBatchManager(store, defaultTieredRedemptionBatchValidator(), clockValue, []);
}
