import * as clock from "../../../../kit/clock.js";
import { PathSummaryValidator, defaultPathSummaryValidator } from "./path-summary-rules.js";
import { PathSummaryStore } from "./path-summary-store.js";

/** Moves path summaries through their life cycle and keeps a journal of what it did. */
export class PathSummaryWorkflow {
  store: PathSummaryStore;
  validator: PathSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PathSummaryStore,
    validator: PathSummaryValidator,
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
      throw new Error(`path summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`path summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newPathSummaryWorkflow(store: PathSummaryStore, clockValue: clock.Clock): PathSummaryWorkflow {
  return new PathSummaryWorkflow(store, defaultPathSummaryValidator(), clockValue, []);
}
