import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveRedemptionSlotValidator,
  defaultAdaptiveRedemptionSlotValidator,
} from "./adaptive-redemption-slot-rules.js";
import { AdaptiveRedemptionSlotStore } from "./adaptive-redemption-slot-store.js";

/** Moves adaptive redemption slots through their life cycle and keeps a journal of what it did. */
export class AdaptiveRedemptionSlotDesk {
  store: AdaptiveRedemptionSlotStore;
  validator: AdaptiveRedemptionSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveRedemptionSlotStore,
    validator: AdaptiveRedemptionSlotValidator,
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
      throw new Error(`adaptive redemption slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive redemption slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newAdaptiveRedemptionSlotDesk(store: AdaptiveRedemptionSlotStore, clockValue: clock.Clock): AdaptiveRedemptionSlotDesk {
  return new AdaptiveRedemptionSlotDesk(store, defaultAdaptiveRedemptionSlotValidator(), clockValue, []);
}
