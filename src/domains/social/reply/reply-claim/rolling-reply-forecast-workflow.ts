import * as clock from "../../../../kit/clock.js";
import {
  RollingReplyForecastValidator,
  defaultRollingReplyForecastValidator,
} from "./rolling-reply-forecast-rules.js";
import { RollingReplyForecastStore } from "./rolling-reply-forecast-store.js";

/** Moves rolling reply forecasts through their life cycle and keeps a journal of what it did. */
export class RollingReplyForecastCoordinator {
  store: RollingReplyForecastStore;
  validator: RollingReplyForecastValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RollingReplyForecastStore,
    validator: RollingReplyForecastValidator,
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
      throw new Error(`rolling reply forecast ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`rolling reply forecast ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
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

export function newRollingReplyForecastCoordinator(store: RollingReplyForecastStore, clockValue: clock.Clock): RollingReplyForecastCoordinator {
  return new RollingReplyForecastCoordinator(store, defaultRollingReplyForecastValidator(), clockValue, []);
}
