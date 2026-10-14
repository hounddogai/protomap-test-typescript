import * as clock from "../../../../kit/clock.js";
import { LenientWarmupEntryValidator, defaultLenientWarmupEntryValidator } from "./lenient-warmup-entry-rules.js";
import { LenientWarmupEntryStore } from "./lenient-warmup-entry-store.js";

/** Moves lenient warmup entries through their life cycle and keeps a journal of what it did. */
export class LenientWarmupEntryDesk {
  store: LenientWarmupEntryStore;
  validator: LenientWarmupEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientWarmupEntryStore,
    validator: LenientWarmupEntryValidator,
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
      throw new Error(`lenient warmup entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient warmup entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newLenientWarmupEntryDesk(store: LenientWarmupEntryStore, clockValue: clock.Clock): LenientWarmupEntryDesk {
  return new LenientWarmupEntryDesk(store, defaultLenientWarmupEntryValidator(), clockValue, []);
}
