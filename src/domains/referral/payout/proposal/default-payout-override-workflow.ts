import * as clock from "../../../../kit/clock.js";
import {
  DefaultPayoutOverrideValidator,
  defaultDefaultPayoutOverrideValidator,
} from "./default-payout-override-rules.js";
import { DefaultPayoutOverrideStore } from "./default-payout-override-store.js";

/** Moves default payout overrides through their life cycle and keeps a journal of what it did. */
export class DefaultPayoutOverrideService {
  store: DefaultPayoutOverrideStore;
  validator: DefaultPayoutOverrideValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultPayoutOverrideStore,
    validator: DefaultPayoutOverrideValidator,
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
      throw new Error(`default payout override ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default payout override ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDefaultPayoutOverrideService(store: DefaultPayoutOverrideStore, clockValue: clock.Clock): DefaultPayoutOverrideService {
  return new DefaultPayoutOverrideService(store, defaultDefaultPayoutOverrideValidator(), clockValue, []);
}
