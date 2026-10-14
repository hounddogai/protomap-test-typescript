import * as clock from "../../../../kit/clock.js";
import {
  ScheduledTouchpointQuotaValidator,
  defaultScheduledTouchpointQuotaValidator,
} from "./scheduled-touchpoint-quota-rules.js";
import { ScheduledTouchpointQuotaStore } from "./scheduled-touchpoint-quota-store.js";

/** Moves scheduled touchpoint quotas through their life cycle and keeps a journal of what it did. */
export class ScheduledTouchpointQuotaDesk {
  store: ScheduledTouchpointQuotaStore;
  validator: ScheduledTouchpointQuotaValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledTouchpointQuotaStore,
    validator: ScheduledTouchpointQuotaValidator,
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
      throw new Error(`scheduled touchpoint quota ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled touchpoint quota ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledTouchpointQuotaDesk(store: ScheduledTouchpointQuotaStore, clockValue: clock.Clock): ScheduledTouchpointQuotaDesk {
  return new ScheduledTouchpointQuotaDesk(store, defaultScheduledTouchpointQuotaValidator(), clockValue, []);
}
