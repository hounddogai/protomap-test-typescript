import * as clock from "../../../../kit/clock.js";
import { TierRollupValidator, defaultTierRollupValidator } from "./tier-rollup-rules.js";
import { TierRollupStore } from "./tier-rollup-store.js";

/** Moves tier rollups through their life cycle and keeps a journal of what it did. */
export class TierRollupService {
  store: TierRollupStore;
  validator: TierRollupValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: TierRollupStore, validator: TierRollupValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`tier rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTierRollupService(store: TierRollupStore, clockValue: clock.Clock): TierRollupService {
  return new TierRollupService(store, defaultTierRollupValidator(), clockValue, []);
}
