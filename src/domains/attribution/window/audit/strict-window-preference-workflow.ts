import * as clock from "../../../../kit/clock.js";
import {
  StrictWindowPreferenceValidator,
  defaultStrictWindowPreferenceValidator,
} from "./strict-window-preference-rules.js";
import { StrictWindowPreferenceStore } from "./strict-window-preference-store.js";

/** Moves strict window preferences through their life cycle and keeps a journal of what it did. */
export class StrictWindowPreferenceManager {
  store: StrictWindowPreferenceStore;
  validator: StrictWindowPreferenceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictWindowPreferenceStore,
    validator: StrictWindowPreferenceValidator,
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
      throw new Error(`strict window preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict window preference ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
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

export function newStrictWindowPreferenceManager(store: StrictWindowPreferenceStore, clockValue: clock.Clock): StrictWindowPreferenceManager {
  return new StrictWindowPreferenceManager(store, defaultStrictWindowPreferenceValidator(), clockValue, []);
}
