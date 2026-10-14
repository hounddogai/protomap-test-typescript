import * as clock from "../../../../kit/clock.js";
import { DoubleOptInEntryValidator, defaultDoubleOptInEntryValidator } from "./double-opt-in-entry-rules.js";
import { DoubleOptInEntryStore } from "./double-opt-in-entry-store.js";

/** Moves double opt in entries through their life cycle and keeps a journal of what it did. */
export class DoubleOptInEntryService {
  store: DoubleOptInEntryStore;
  validator: DoubleOptInEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DoubleOptInEntryStore,
    validator: DoubleOptInEntryValidator,
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
      throw new Error(`double opt in entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newDoubleOptInEntryService(store: DoubleOptInEntryStore, clockValue: clock.Clock): DoubleOptInEntryService {
  return new DoubleOptInEntryService(store, defaultDoubleOptInEntryValidator(), clockValue, []);
}
