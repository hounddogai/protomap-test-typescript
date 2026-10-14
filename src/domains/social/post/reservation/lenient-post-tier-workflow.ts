import * as clock from "../../../../kit/clock.js";
import { LenientPostTierValidator, defaultLenientPostTierValidator } from "./lenient-post-tier-rules.js";
import { LenientPostTierStore } from "./lenient-post-tier-store.js";

/** Moves lenient post tiers through their life cycle and keeps a journal of what it did. */
export class LenientPostTierDesk {
  store: LenientPostTierStore;
  validator: LenientPostTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: LenientPostTierStore,
    validator: LenientPostTierValidator,
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
      throw new Error(`lenient post tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`lenient post tier ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newLenientPostTierDesk(store: LenientPostTierStore, clockValue: clock.Clock): LenientPostTierDesk {
  return new LenientPostTierDesk(store, defaultLenientPostTierValidator(), clockValue, []);
}
