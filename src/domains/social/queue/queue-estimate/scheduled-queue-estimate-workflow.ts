import * as clock from "../../../../kit/clock.js";
import {
  ScheduledQueueEstimateValidator,
  defaultScheduledQueueEstimateValidator,
} from "./scheduled-queue-estimate-rules.js";
import { ScheduledQueueEstimateStore } from "./scheduled-queue-estimate-store.js";

/** Moves scheduled queue estimates through their life cycle and keeps a journal of what it did. */
export class ScheduledQueueEstimateDesk {
  store: ScheduledQueueEstimateStore;
  validator: ScheduledQueueEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledQueueEstimateStore,
    validator: ScheduledQueueEstimateValidator,
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
      throw new Error(`scheduled queue estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled queue estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newScheduledQueueEstimateDesk(store: ScheduledQueueEstimateStore, clockValue: clock.Clock): ScheduledQueueEstimateDesk {
  return new ScheduledQueueEstimateDesk(store, defaultScheduledQueueEstimateValidator(), clockValue, []);
}
