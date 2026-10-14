import * as clock from "../../../../kit/clock.js";
import { RedemptionMetricValidator, defaultRedemptionMetricValidator } from "./redemption-metric-rules.js";
import { RedemptionMetricStore } from "./redemption-metric-store.js";

/** Moves redemption metrics through their life cycle and keeps a journal of what it did. */
export class RedemptionMetricWorkflow {
  store: RedemptionMetricStore;
  validator: RedemptionMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RedemptionMetricStore,
    validator: RedemptionMetricValidator,
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
      throw new Error(`redemption metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption metric ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRedemptionMetricWorkflow(store: RedemptionMetricStore, clockValue: clock.Clock): RedemptionMetricWorkflow {
  return new RedemptionMetricWorkflow(store, defaultRedemptionMetricValidator(), clockValue, []);
}
