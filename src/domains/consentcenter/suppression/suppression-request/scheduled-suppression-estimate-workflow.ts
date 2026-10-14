import * as clock from "../../../../kit/clock.js";
import {
  ScheduledSuppressionEstimateValidator,
  defaultScheduledSuppressionEstimateValidator,
} from "./scheduled-suppression-estimate-rules.js";
import { ScheduledSuppressionEstimateStore } from "./scheduled-suppression-estimate-store.js";

/** Moves scheduled suppression estimates through their life cycle and keeps a journal of what it did. */
export class ScheduledSuppressionEstimateDesk {
  store: ScheduledSuppressionEstimateStore;
  validator: ScheduledSuppressionEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledSuppressionEstimateStore,
    validator: ScheduledSuppressionEstimateValidator,
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
      throw new Error(`scheduled suppression estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled suppression estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newScheduledSuppressionEstimateDesk(store: ScheduledSuppressionEstimateStore, clockValue: clock.Clock): ScheduledSuppressionEstimateDesk {
  return new ScheduledSuppressionEstimateDesk(store, defaultScheduledSuppressionEstimateValidator(), clockValue, []);
}
