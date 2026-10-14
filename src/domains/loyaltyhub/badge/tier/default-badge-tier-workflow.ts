import * as clock from "../../../../kit/clock.js";
import { DefaultBadgeTierValidator, defaultDefaultBadgeTierValidator } from "./default-badge-tier-rules.js";
import { DefaultBadgeTierStore } from "./default-badge-tier-store.js";

/** Moves default badge tiers through their life cycle and keeps a journal of what it did. */
export class DefaultBadgeTierCoordinator {
  store: DefaultBadgeTierStore;
  validator: DefaultBadgeTierValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultBadgeTierStore,
    validator: DefaultBadgeTierValidator,
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
      throw new Error(`default badge tier ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default badge tier ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newDefaultBadgeTierCoordinator(store: DefaultBadgeTierStore, clockValue: clock.Clock): DefaultBadgeTierCoordinator {
  return new DefaultBadgeTierCoordinator(store, defaultDefaultBadgeTierValidator(), clockValue, []);
}
