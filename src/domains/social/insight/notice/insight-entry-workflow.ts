import * as clock from "../../../../kit/clock.js";
import { InsightEntryValidator, defaultInsightEntryValidator } from "./insight-entry-rules.js";
import { InsightEntryStore } from "./insight-entry-store.js";

/** Moves insight entries through their life cycle and keeps a journal of what it did. */
export class InsightEntryDesk {
  store: InsightEntryStore;
  validator: InsightEntryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: InsightEntryStore,
    validator: InsightEntryValidator,
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
      throw new Error(`insight entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`insight entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
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

export function newInsightEntryDesk(store: InsightEntryStore, clockValue: clock.Clock): InsightEntryDesk {
  return new InsightEntryDesk(store, defaultInsightEntryValidator(), clockValue, []);
}
