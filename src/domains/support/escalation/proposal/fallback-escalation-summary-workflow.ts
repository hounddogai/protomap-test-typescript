import * as clock from "../../../../kit/clock.js";
import {
  FallbackEscalationSummaryValidator,
  defaultFallbackEscalationSummaryValidator,
} from "./fallback-escalation-summary-rules.js";
import { FallbackEscalationSummaryStore } from "./fallback-escalation-summary-store.js";

/** Moves fallback escalation summaries through their life cycle and keeps a journal of what it did. */
export class FallbackEscalationSummaryDesk {
  store: FallbackEscalationSummaryStore;
  validator: FallbackEscalationSummaryValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FallbackEscalationSummaryStore,
    validator: FallbackEscalationSummaryValidator,
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
      throw new Error(`fallback escalation summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback escalation summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
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

export function newFallbackEscalationSummaryDesk(store: FallbackEscalationSummaryStore, clockValue: clock.Clock): FallbackEscalationSummaryDesk {
  return new FallbackEscalationSummaryDesk(store, defaultFallbackEscalationSummaryValidator(), clockValue, []);
}
