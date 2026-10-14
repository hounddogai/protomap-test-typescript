import * as clock from "../../../../kit/clock.js";
import {
  SeasonalTierBaselineValidator,
  defaultSeasonalTierBaselineValidator,
} from "./seasonal-tier-baseline-rules.js";
import { SeasonalTierBaselineStore } from "./seasonal-tier-baseline-store.js";

/** Moves seasonal tier baselines through their life cycle and keeps a journal of what it did. */
export class SeasonalTierBaselineWorkflow {
  store: SeasonalTierBaselineStore;
  validator: SeasonalTierBaselineValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalTierBaselineStore,
    validator: SeasonalTierBaselineValidator,
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
      throw new Error(`seasonal tier baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal tier baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newSeasonalTierBaselineWorkflow(store: SeasonalTierBaselineStore, clockValue: clock.Clock): SeasonalTierBaselineWorkflow {
  return new SeasonalTierBaselineWorkflow(store, defaultSeasonalTierBaselineValidator(), clockValue, []);
}
