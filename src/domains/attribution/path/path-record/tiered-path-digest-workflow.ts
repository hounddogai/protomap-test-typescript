import * as clock from "../../../../kit/clock.js";
import { TieredPathDigestValidator, defaultTieredPathDigestValidator } from "./tiered-path-digest-rules.js";
import { TieredPathDigestStore } from "./tiered-path-digest-store.js";

/** Moves tiered path digests through their life cycle and keeps a journal of what it did. */
export class TieredPathDigestManager {
  store: TieredPathDigestStore;
  validator: TieredPathDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredPathDigestStore,
    validator: TieredPathDigestValidator,
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
      throw new Error(`tiered path digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered path digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredPathDigestManager(store: TieredPathDigestStore, clockValue: clock.Clock): TieredPathDigestManager {
  return new TieredPathDigestManager(store, defaultTieredPathDigestValidator(), clockValue, []);
}
