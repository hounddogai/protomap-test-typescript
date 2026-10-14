import * as clock from "../../../../kit/clock.js";
import { CsatEntryValidator, defaultCsatEntryValidator } from "./csat-entry-rules.js";
import { CsatEntryStore } from "./csat-entry-store.js";

/** Moves csat entries through their life cycle and keeps a journal of what it did. */
export class CsatEntryManager {
  store: CsatEntryStore;
  validator: CsatEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(store: CsatEntryStore, validator: CsatEntryValidator, clockValue: clock.Clock, journal: string[]) {
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
      throw new Error(`csat entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newCsatEntryManager(store: CsatEntryStore, clockValue: clock.Clock): CsatEntryManager {
  return new CsatEntryManager(store, defaultCsatEntryValidator(), clockValue, []);
}
