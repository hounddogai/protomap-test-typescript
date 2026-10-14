import * as clock from "../../../../kit/clock.js";
import { WeightedRewardEntryValidator, defaultWeightedRewardEntryValidator } from "./weighted-reward-entry-rules.js";
import { WeightedRewardEntryStore } from "./weighted-reward-entry-store.js";

/** Moves weighted reward entries through their life cycle and keeps a journal of what it did. */
export class WeightedRewardEntryManager {
  store: WeightedRewardEntryStore;
  validator: WeightedRewardEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedRewardEntryStore,
    validator: WeightedRewardEntryValidator,
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
      throw new Error(`weighted reward entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reward entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newWeightedRewardEntryManager(store: WeightedRewardEntryStore, clockValue: clock.Clock): WeightedRewardEntryManager {
  return new WeightedRewardEntryManager(store, defaultWeightedRewardEntryValidator(), clockValue, []);
}
