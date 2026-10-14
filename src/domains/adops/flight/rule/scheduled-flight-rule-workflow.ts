import * as clock from "../../../../kit/clock.js";
import { ScheduledFlightRuleValidator, defaultScheduledFlightRuleValidator } from "./scheduled-flight-rule-rules.js";
import { ScheduledFlightRuleStore } from "./scheduled-flight-rule-store.js";

/** Moves scheduled flight rules through their life cycle and keeps a journal of what it did. */
export class ScheduledFlightRuleService {
  store: ScheduledFlightRuleStore;
  validator: ScheduledFlightRuleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledFlightRuleStore,
    validator: ScheduledFlightRuleValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight rule ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled flight rule ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledFlightRuleService(store: ScheduledFlightRuleStore, clockValue: clock.Clock): ScheduledFlightRuleService {
  return new ScheduledFlightRuleService(store, defaultScheduledFlightRuleValidator(), clockValue, []);
}
