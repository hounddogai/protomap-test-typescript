import * as clock from "../../../../kit/clock.js";
import { StrictPathEntryValidator, defaultStrictPathEntryValidator } from "./strict-path-entry-rules.js";
import { StrictPathEntryStore } from "./strict-path-entry-store.js";

/** Moves strict path entries through their life cycle and keeps a journal of what it did. */
export class StrictPathEntryDesk {
  store: StrictPathEntryStore;
  validator: StrictPathEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictPathEntryStore,
    validator: StrictPathEntryValidator,
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
      throw new Error(`strict path entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict path entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictPathEntryDesk(store: StrictPathEntryStore, clockValue: clock.Clock): StrictPathEntryDesk {
  return new StrictPathEntryDesk(store, defaultStrictPathEntryValidator(), clockValue, []);
}
