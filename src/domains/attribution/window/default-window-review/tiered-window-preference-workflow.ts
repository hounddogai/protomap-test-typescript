import * as clock from "../../../../kit/clock.js";
import {
  TieredWindowPreferenceValidator,
  defaultTieredWindowPreferenceValidator,
} from "./tiered-window-preference-rules.js";
import { TieredWindowPreferenceStore } from "./tiered-window-preference-store.js";

/** Moves tiered window preferences through their life cycle and keeps a journal of what it did. */
export class TieredWindowPreferenceCoordinator {
  store: TieredWindowPreferenceStore;
  validator: TieredWindowPreferenceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredWindowPreferenceStore,
    validator: TieredWindowPreferenceValidator,
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
      throw new Error(`tiered window preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered window preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newTieredWindowPreferenceCoordinator(store: TieredWindowPreferenceStore, clockValue: clock.Clock): TieredWindowPreferenceCoordinator {
  return new TieredWindowPreferenceCoordinator(store, defaultTieredWindowPreferenceValidator(), clockValue, []);
}
