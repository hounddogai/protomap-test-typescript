import * as clock from "../../../../kit/clock.js";
import { TieredInviteRecordValidator, defaultTieredInviteRecordValidator } from "./tiered-invite-record-rules.js";
import { TieredInviteRecordStore } from "./tiered-invite-record-store.js";

/** Moves tiered invite records through their life cycle and keeps a journal of what it did. */
export class TieredInviteRecordManager {
  store: TieredInviteRecordStore;
  validator: TieredInviteRecordValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredInviteRecordStore,
    validator: TieredInviteRecordValidator,
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
      throw new Error(`tiered invite record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered invite record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newTieredInviteRecordManager(store: TieredInviteRecordStore, clockValue: clock.Clock): TieredInviteRecordManager {
  return new TieredInviteRecordManager(store, defaultTieredInviteRecordValidator(), clockValue, []);
}
