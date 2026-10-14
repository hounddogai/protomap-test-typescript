import * as clock from "../../../../kit/clock.js";
import {
  CappedFunnelExceptionValidator,
  defaultCappedFunnelExceptionValidator,
} from "./capped-funnel-exception-rules.js";
import { CappedFunnelExceptionStore } from "./capped-funnel-exception-store.js";

/** Moves capped funnel exceptions through their life cycle and keeps a journal of what it did. */
export class CappedFunnelExceptionWorkflow {
  store: CappedFunnelExceptionStore;
  validator: CappedFunnelExceptionValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: CappedFunnelExceptionStore,
    validator: CappedFunnelExceptionValidator,
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
      throw new Error(`capped funnel exception ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`capped funnel exception ${code} not found`);
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
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newCappedFunnelExceptionWorkflow(store: CappedFunnelExceptionStore, clockValue: clock.Clock): CappedFunnelExceptionWorkflow {
  return new CappedFunnelExceptionWorkflow(store, defaultCappedFunnelExceptionValidator(), clockValue, []);
}
