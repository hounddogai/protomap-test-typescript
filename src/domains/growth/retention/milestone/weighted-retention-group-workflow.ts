import * as clock from "../../../../kit/clock.js";
import {
  WeightedRetentionGroupValidator,
  defaultWeightedRetentionGroupValidator,
} from "./weighted-retention-group-rules.js";
import { WeightedRetentionGroupStore } from "./weighted-retention-group-store.js";

/** Moves weighted retention groups through their life cycle and keeps a journal of what it did. */
export class WeightedRetentionGroupDesk {
  store: WeightedRetentionGroupStore;
  validator: WeightedRetentionGroupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedRetentionGroupStore,
    validator: WeightedRetentionGroupValidator,
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
      throw new Error(`weighted retention group ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted retention group ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newWeightedRetentionGroupDesk(store: WeightedRetentionGroupStore, clockValue: clock.Clock): WeightedRetentionGroupDesk {
  return new WeightedRetentionGroupDesk(store, defaultWeightedRetentionGroupValidator(), clockValue, []);
}
