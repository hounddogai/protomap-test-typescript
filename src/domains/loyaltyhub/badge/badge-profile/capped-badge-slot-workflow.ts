import * as clock from "../../../../kit/clock.js";
import { CappedBadgeSlotValidator, defaultCappedBadgeSlotValidator } from "./capped-badge-slot-rules.js";
import { CappedBadgeSlotStore } from "./capped-badge-slot-store.js";

/** Moves capped badge slots through their life cycle and keeps a journal of what it did. */
export class CappedBadgeSlotService {
  store: CappedBadgeSlotStore;
  validator: CappedBadgeSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedBadgeSlotStore,
    validator: CappedBadgeSlotValidator,
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
      throw new Error(`capped badge slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped badge slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newCappedBadgeSlotService(store: CappedBadgeSlotStore, clockValue: clock.Clock): CappedBadgeSlotService {
  return new CappedBadgeSlotService(store, defaultCappedBadgeSlotValidator(), clockValue, []);
}
