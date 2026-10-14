import * as clock from "../../../../kit/clock.js";
import {
  RegionalBidRuleForecastValidator,
  defaultRegionalBidRuleForecastValidator,
} from "./regional-bid-rule-forecast-rules.js";
import { RegionalBidRuleForecastStore } from "./regional-bid-rule-forecast-store.js";

/** Moves regional bid rule forecasts through their life cycle and keeps a journal of what it did. */
export class RegionalBidRuleForecastManager {
  store: RegionalBidRuleForecastStore;
  validator: RegionalBidRuleForecastValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RegionalBidRuleForecastStore,
    validator: RegionalBidRuleForecastValidator,
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
      throw new Error(`regional bid rule forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional bid rule forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newRegionalBidRuleForecastManager(store: RegionalBidRuleForecastStore, clockValue: clock.Clock): RegionalBidRuleForecastManager {
  return new RegionalBidRuleForecastManager(store, defaultRegionalBidRuleForecastValidator(), clockValue, []);
}
