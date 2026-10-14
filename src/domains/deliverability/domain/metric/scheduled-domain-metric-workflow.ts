import * as clock from "../../../../kit/clock.js";
import {
  ScheduledDomainMetricValidator,
  defaultScheduledDomainMetricValidator,
} from "./scheduled-domain-metric-rules.js";
import { ScheduledDomainMetricStore } from "./scheduled-domain-metric-store.js";

/** Moves scheduled domain metrics through their life cycle and keeps a journal of what it did. */
export class ScheduledDomainMetricDesk {
  store: ScheduledDomainMetricStore;
  validator: ScheduledDomainMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledDomainMetricStore,
    validator: ScheduledDomainMetricValidator,
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
      throw new Error(`scheduled domain metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled domain metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
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

export function newScheduledDomainMetricDesk(store: ScheduledDomainMetricStore, clockValue: clock.Clock): ScheduledDomainMetricDesk {
  return new ScheduledDomainMetricDesk(store, defaultScheduledDomainMetricValidator(), clockValue, []);
}
