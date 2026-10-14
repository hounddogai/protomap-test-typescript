import * as clock from "../../../../kit/clock.js";
import { ExitRuleSummaryValidator, defaultExitRuleSummaryValidator } from "./exit-rule-summary-rules.js";
import { ExitRuleSummaryStore } from "./exit-rule-summary-store.js";

/** Moves exit rule summaries through their life cycle and keeps a journal of what it did. */
export class ExitRuleSummaryDesk {
  store: ExitRuleSummaryStore;
  validator: ExitRuleSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ExitRuleSummaryStore,
    validator: ExitRuleSummaryValidator,
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
      throw new Error(`exit rule summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newExitRuleSummaryDesk(store: ExitRuleSummaryStore, clockValue: clock.Clock): ExitRuleSummaryDesk {
  return new ExitRuleSummaryDesk(store, defaultExitRuleSummaryValidator(), clockValue, []);
}
