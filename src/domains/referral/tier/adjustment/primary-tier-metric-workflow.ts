import * as clock from "../../../../kit/clock.js";
import { PrimaryTierMetricValidator, defaultPrimaryTierMetricValidator } from "./primary-tier-metric-rules.js";
import { PrimaryTierMetricStore } from "./primary-tier-metric-store.js";

/** Moves primary tier metrics through their life cycle and keeps a journal of what it did. */
export class PrimaryTierMetricDesk {
  store: PrimaryTierMetricStore;
  validator: PrimaryTierMetricValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryTierMetricStore,
    validator: PrimaryTierMetricValidator,
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
      throw new Error(`primary tier metric ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary tier metric ${code} not found`);
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

export function newPrimaryTierMetricDesk(store: PrimaryTierMetricStore, clockValue: clock.Clock): PrimaryTierMetricDesk {
  return new PrimaryTierMetricDesk(store, defaultPrimaryTierMetricValidator(), clockValue, []);
}
