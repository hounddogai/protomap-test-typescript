import * as clock from "../../../../kit/clock.js";
import {
  ScheduledDeflectionMetricValidator,
  defaultScheduledDeflectionMetricValidator,
} from "./scheduled-deflection-metric-rules.js";
import { ScheduledDeflectionMetricStore } from "./scheduled-deflection-metric-store.js";

/** Moves scheduled deflection metrics through their life cycle and keeps a journal of what it did. */
export class ScheduledDeflectionMetricManager {
  store: ScheduledDeflectionMetricStore;
  validator: ScheduledDeflectionMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ScheduledDeflectionMetricStore,
    validator: ScheduledDeflectionMetricValidator,
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
      throw new Error(`scheduled deflection metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`scheduled deflection metric ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newScheduledDeflectionMetricManager(store: ScheduledDeflectionMetricStore, clockValue: clock.Clock): ScheduledDeflectionMetricManager {
  return new ScheduledDeflectionMetricManager(store, defaultScheduledDeflectionMetricValidator(), clockValue, []);
}
