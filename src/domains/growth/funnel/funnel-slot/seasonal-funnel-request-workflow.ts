import * as clock from "../../../../kit/clock.js";
import {
  SeasonalFunnelRequestValidator,
  defaultSeasonalFunnelRequestValidator,
} from "./seasonal-funnel-request-rules.js";
import { SeasonalFunnelRequestStore } from "./seasonal-funnel-request-store.js";

/** Moves seasonal funnel requests through their life cycle and keeps a journal of what it did. */
export class SeasonalFunnelRequestDesk {
  store: SeasonalFunnelRequestStore;
  validator: SeasonalFunnelRequestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalFunnelRequestStore,
    validator: SeasonalFunnelRequestValidator,
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
      throw new Error(`seasonal funnel request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal funnel request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newSeasonalFunnelRequestDesk(store: SeasonalFunnelRequestStore, clockValue: clock.Clock): SeasonalFunnelRequestDesk {
  return new SeasonalFunnelRequestDesk(store, defaultSeasonalFunnelRequestValidator(), clockValue, []);
}
