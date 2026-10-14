import * as clock from "../../../../kit/clock.js";
import { BounceMetricValidator, defaultBounceMetricValidator } from "./bounce-metric-rules.js";
import { BounceMetricStore } from "./bounce-metric-store.js";

/** Moves bounce metrics through their life cycle and keeps a journal of what it did. */
export class BounceMetricDesk {
  store: BounceMetricStore;
  validator: BounceMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BounceMetricStore,
    validator: BounceMetricValidator,
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
      throw new Error(`bounce metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`bounce metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newBounceMetricDesk(store: BounceMetricStore, clockValue: clock.Clock): BounceMetricDesk {
  return new BounceMetricDesk(store, defaultBounceMetricValidator(), clockValue, []);
}
