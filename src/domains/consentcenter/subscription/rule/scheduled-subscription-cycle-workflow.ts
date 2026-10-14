import * as clock from "../../../../kit/clock.js";
import {
  ScheduledSubscriptionCycleValidator,
  defaultScheduledSubscriptionCycleValidator,
} from "./scheduled-subscription-cycle-rules.js";
import { ScheduledSubscriptionCycleStore } from "./scheduled-subscription-cycle-store.js";

/** Moves scheduled subscription cycles through their life cycle and keeps a journal of what it did. */
export class ScheduledSubscriptionCycleManager {
  store: ScheduledSubscriptionCycleStore;
  validator: ScheduledSubscriptionCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledSubscriptionCycleStore,
    validator: ScheduledSubscriptionCycleValidator,
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
      throw new Error(`scheduled subscription cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled subscription cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newScheduledSubscriptionCycleManager(store: ScheduledSubscriptionCycleStore, clockValue: clock.Clock): ScheduledSubscriptionCycleManager {
  return new ScheduledSubscriptionCycleManager(store, defaultScheduledSubscriptionCycleValidator(), clockValue, []);
}
