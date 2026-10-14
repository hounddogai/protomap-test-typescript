import * as clock from "../../../../kit/clock.js";
import {
  PrimaryLeaderboardBundleValidator,
  defaultPrimaryLeaderboardBundleValidator,
} from "./primary-leaderboard-bundle-rules.js";
import { PrimaryLeaderboardBundleStore } from "./primary-leaderboard-bundle-store.js";

/** Moves primary leaderboard bundles through their life cycle and keeps a journal of what it did. */
export class PrimaryLeaderboardBundleService {
  store: PrimaryLeaderboardBundleStore;
  validator: PrimaryLeaderboardBundleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryLeaderboardBundleStore,
    validator: PrimaryLeaderboardBundleValidator,
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
      throw new Error(`primary leaderboard bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary leaderboard bundle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newPrimaryLeaderboardBundleService(store: PrimaryLeaderboardBundleStore, clockValue: clock.Clock): PrimaryLeaderboardBundleService {
  return new PrimaryLeaderboardBundleService(store, defaultPrimaryLeaderboardBundleValidator(), clockValue, []);
}
