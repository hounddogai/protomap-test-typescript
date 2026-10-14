import * as clock from "../../../../kit/clock.js";
import {
  WeightedPreferenceBaselineValidator,
  defaultWeightedPreferenceBaselineValidator,
} from "./weighted-preference-baseline-rules.js";
import { WeightedPreferenceBaselineStore } from "./weighted-preference-baseline-store.js";

/** Moves weighted preference baselines through their life cycle and keeps a journal of what it did. */
export class WeightedPreferenceBaselineDesk {
  store: WeightedPreferenceBaselineStore;
  validator: WeightedPreferenceBaselineValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedPreferenceBaselineStore,
    validator: WeightedPreferenceBaselineValidator,
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
      throw new Error(`weighted preference baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted preference baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedPreferenceBaselineDesk(store: WeightedPreferenceBaselineStore, clockValue: clock.Clock): WeightedPreferenceBaselineDesk {
  return new WeightedPreferenceBaselineDesk(store, defaultWeightedPreferenceBaselineValidator(), clockValue, []);
}
