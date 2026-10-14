import * as clock from "../../../../kit/clock.js";
import {
  WeightedDeflectionEntryValidator,
  defaultWeightedDeflectionEntryValidator,
} from "./weighted-deflection-entry-rules.js";
import { WeightedDeflectionEntryStore } from "./weighted-deflection-entry-store.js";

/** Moves weighted deflection entries through their life cycle and keeps a journal of what it did. */
export class WeightedDeflectionEntryManager {
  store: WeightedDeflectionEntryStore;
  validator: WeightedDeflectionEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedDeflectionEntryStore,
    validator: WeightedDeflectionEntryValidator,
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
      throw new Error(`weighted deflection entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted deflection entry ${code} not found`);
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
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedDeflectionEntryManager(store: WeightedDeflectionEntryStore, clockValue: clock.Clock): WeightedDeflectionEntryManager {
  return new WeightedDeflectionEntryManager(store, defaultWeightedDeflectionEntryValidator(), clockValue, []);
}
