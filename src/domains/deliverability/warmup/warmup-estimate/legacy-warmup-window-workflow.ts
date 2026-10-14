import * as clock from "../../../../kit/clock.js";
import { LegacyWarmupWindowValidator, defaultLegacyWarmupWindowValidator } from "./legacy-warmup-window-rules.js";
import { LegacyWarmupWindowStore } from "./legacy-warmup-window-store.js";

/** Moves legacy warmup windows through their life cycle and keeps a journal of what it did. */
export class LegacyWarmupWindowService {
  store: LegacyWarmupWindowStore;
  validator: LegacyWarmupWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LegacyWarmupWindowStore,
    validator: LegacyWarmupWindowValidator,
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
      throw new Error(`legacy warmup window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`legacy warmup window ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLegacyWarmupWindowService(store: LegacyWarmupWindowStore, clockValue: clock.Clock): LegacyWarmupWindowService {
  return new LegacyWarmupWindowService(store, defaultLegacyWarmupWindowValidator(), clockValue, []);
}
