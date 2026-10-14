import * as clock from "../../../../kit/clock.js";
import { TierRecordValidator, defaultTierRecordValidator } from "./tier-record-rules.js";
import { TierRecordStore } from "./tier-record-store.js";

/** Moves tier records through their life cycle and keeps a journal of what it did. */
export class TierRecordManager {
  store: TierRecordStore;
  validator: TierRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: TierRecordStore, validator: TierRecordValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`tier record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tier record ${code} not found`);
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
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTierRecordManager(store: TierRecordStore, clockValue: clock.Clock): TierRecordManager {
  return new TierRecordManager(store, defaultTierRecordValidator(), clockValue, []);
}
