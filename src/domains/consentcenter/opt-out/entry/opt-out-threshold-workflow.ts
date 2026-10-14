import * as clock from "../../../../kit/clock.js";
import { OptOutThresholdValidator, defaultOptOutThresholdValidator } from "./opt-out-threshold-rules.js";
import { OptOutThresholdStore } from "./opt-out-threshold-store.js";

/** Moves opt out thresholds through their life cycle and keeps a journal of what it did. */
export class OptOutThresholdDesk {
  store: OptOutThresholdStore;
  validator: OptOutThresholdValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: OptOutThresholdStore,
    validator: OptOutThresholdValidator,
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
      throw new Error(`opt out threshold ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`opt out threshold ${code} not found`);
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

export function newOptOutThresholdDesk(store: OptOutThresholdStore, clockValue: clock.Clock): OptOutThresholdDesk {
  return new OptOutThresholdDesk(store, defaultOptOutThresholdValidator(), clockValue, []);
}
