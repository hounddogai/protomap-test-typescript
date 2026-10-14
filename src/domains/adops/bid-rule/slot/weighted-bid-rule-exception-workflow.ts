import * as clock from "../../../../kit/clock.js";
import {
  WeightedBidRuleExceptionValidator,
  defaultWeightedBidRuleExceptionValidator,
} from "./weighted-bid-rule-exception-rules.js";
import { WeightedBidRuleExceptionStore } from "./weighted-bid-rule-exception-store.js";

/** Moves weighted bid rule exceptions through their life cycle and keeps a journal of what it did. */
export class WeightedBidRuleExceptionService {
  store: WeightedBidRuleExceptionStore;
  validator: WeightedBidRuleExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedBidRuleExceptionStore,
    validator: WeightedBidRuleExceptionValidator,
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
      throw new Error(`weighted bid rule exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted bid rule exception ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedBidRuleExceptionService(store: WeightedBidRuleExceptionStore, clockValue: clock.Clock): WeightedBidRuleExceptionService {
  return new WeightedBidRuleExceptionService(store, defaultWeightedBidRuleExceptionValidator(), clockValue, []);
}
