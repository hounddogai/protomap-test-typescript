import * as clock from "../../../../kit/clock.js";
import {
  TieredRedemptionGroupValidator,
  defaultTieredRedemptionGroupValidator,
} from "./tiered-redemption-group-rules.js";
import { TieredRedemptionGroupStore } from "./tiered-redemption-group-store.js";

/** Moves tiered redemption groups through their life cycle and keeps a journal of what it did. */
export class TieredRedemptionGroupCoordinator {
  store: TieredRedemptionGroupStore;
  validator: TieredRedemptionGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredRedemptionGroupStore,
    validator: TieredRedemptionGroupValidator,
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
      throw new Error(`tiered redemption group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered redemption group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newTieredRedemptionGroupCoordinator(store: TieredRedemptionGroupStore, clockValue: clock.Clock): TieredRedemptionGroupCoordinator {
  return new TieredRedemptionGroupCoordinator(store, defaultTieredRedemptionGroupValidator(), clockValue, []);
}
