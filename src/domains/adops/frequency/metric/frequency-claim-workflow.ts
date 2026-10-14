import * as clock from "../../../../kit/clock.js";
import { FrequencyClaimValidator, defaultFrequencyClaimValidator } from "./frequency-claim-rules.js";
import { FrequencyClaimStore } from "./frequency-claim-store.js";

/** Moves frequency claims through their life cycle and keeps a journal of what it did. */
export class FrequencyClaimDesk {
  store: FrequencyClaimStore;
  validator: FrequencyClaimValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: FrequencyClaimStore,
    validator: FrequencyClaimValidator,
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
      throw new Error(`frequency claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency claim ${code} not found`);
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

export function newFrequencyClaimDesk(store: FrequencyClaimStore, clockValue: clock.Clock): FrequencyClaimDesk {
  return new FrequencyClaimDesk(store, defaultFrequencyClaimValidator(), clockValue, []);
}
