import * as clock from "../../../../kit/clock.js";
import { FallbackCohortSlotValidator, defaultFallbackCohortSlotValidator } from "./fallback-cohort-slot-rules.js";
import { FallbackCohortSlotStore } from "./fallback-cohort-slot-store.js";

/** Moves fallback cohort slots through their life cycle and keeps a journal of what it did. */
export class FallbackCohortSlotDesk {
  store: FallbackCohortSlotStore;
  validator: FallbackCohortSlotValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FallbackCohortSlotStore,
    validator: FallbackCohortSlotValidator,
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
      throw new Error(`fallback cohort slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback cohort slot ${code} not found`);
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
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newFallbackCohortSlotDesk(store: FallbackCohortSlotStore, clockValue: clock.Clock): FallbackCohortSlotDesk {
  return new FallbackCohortSlotDesk(store, defaultFallbackCohortSlotValidator(), clockValue, []);
}
