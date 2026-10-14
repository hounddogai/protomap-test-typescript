import * as clock from "../../../../kit/clock.js";
import {
  RollingFunnelRequestValidator,
  defaultRollingFunnelRequestValidator,
} from "./rolling-funnel-request-rules.js";
import { RollingFunnelRequestStore } from "./rolling-funnel-request-store.js";

/** Moves rolling funnel requests through their life cycle and keeps a journal of what it did. */
export class RollingFunnelRequestDesk {
  store: RollingFunnelRequestStore;
  validator: RollingFunnelRequestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingFunnelRequestStore,
    validator: RollingFunnelRequestValidator,
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
      throw new Error(`rolling funnel request ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling funnel request ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
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

export function newRollingFunnelRequestDesk(store: RollingFunnelRequestStore, clockValue: clock.Clock): RollingFunnelRequestDesk {
  return new RollingFunnelRequestDesk(store, defaultRollingFunnelRequestValidator(), clockValue, []);
}
