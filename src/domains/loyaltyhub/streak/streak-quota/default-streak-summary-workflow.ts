import * as clock from "../../../../kit/clock.js";
import {
  DefaultStreakSummaryValidator,
  defaultDefaultStreakSummaryValidator,
} from "./default-streak-summary-rules.js";
import { DefaultStreakSummaryStore } from "./default-streak-summary-store.js";

/** Moves default streak summaries through their life cycle and keeps a journal of what it did. */
export class DefaultStreakSummaryService {
  store: DefaultStreakSummaryStore;
  validator: DefaultStreakSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultStreakSummaryStore,
    validator: DefaultStreakSummaryValidator,
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
      throw new Error(`default streak summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default streak summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newDefaultStreakSummaryService(store: DefaultStreakSummaryStore, clockValue: clock.Clock): DefaultStreakSummaryService {
  return new DefaultStreakSummaryService(store, defaultDefaultStreakSummaryValidator(), clockValue, []);
}
