import * as clock from "../../../../kit/clock.js";
import { WarmupPreferenceValidator, defaultWarmupPreferenceValidator } from "./warmup-preference-rules.js";
import { WarmupPreferenceStore } from "./warmup-preference-store.js";

/** Moves warmup preferences through their life cycle and keeps a journal of what it did. */
export class WarmupPreferenceDesk {
  store: WarmupPreferenceStore;
  validator: WarmupPreferenceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WarmupPreferenceStore,
    validator: WarmupPreferenceValidator,
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
      throw new Error(`warmup preference ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup preference ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWarmupPreferenceDesk(store: WarmupPreferenceStore, clockValue: clock.Clock): WarmupPreferenceDesk {
  return new WarmupPreferenceDesk(store, defaultWarmupPreferenceValidator(), clockValue, []);
}
