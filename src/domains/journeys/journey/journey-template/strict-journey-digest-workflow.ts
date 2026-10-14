import * as clock from "../../../../kit/clock.js";
import { StrictJourneyDigestValidator, defaultStrictJourneyDigestValidator } from "./strict-journey-digest-rules.js";
import { StrictJourneyDigestStore } from "./strict-journey-digest-store.js";

/** Moves strict journey digests through their life cycle and keeps a journal of what it did. */
export class StrictJourneyDigestDesk {
  store: StrictJourneyDigestStore;
  validator: StrictJourneyDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictJourneyDigestStore,
    validator: StrictJourneyDigestValidator,
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
      throw new Error(`strict journey digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict journey digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStrictJourneyDigestDesk(store: StrictJourneyDigestStore, clockValue: clock.Clock): StrictJourneyDigestDesk {
  return new StrictJourneyDigestDesk(store, defaultStrictJourneyDigestValidator(), clockValue, []);
}
