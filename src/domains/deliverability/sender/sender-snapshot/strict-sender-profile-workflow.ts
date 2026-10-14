import * as clock from "../../../../kit/clock.js";
import { StrictSenderProfileValidator, defaultStrictSenderProfileValidator } from "./strict-sender-profile-rules.js";
import { StrictSenderProfileStore } from "./strict-sender-profile-store.js";

/** Moves strict sender profiles through their life cycle and keeps a journal of what it did. */
export class StrictSenderProfileService {
  store: StrictSenderProfileStore;
  validator: StrictSenderProfileValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StrictSenderProfileStore,
    validator: StrictSenderProfileValidator,
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
      throw new Error(`strict sender profile ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict sender profile ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newStrictSenderProfileService(store: StrictSenderProfileStore, clockValue: clock.Clock): StrictSenderProfileService {
  return new StrictSenderProfileService(store, defaultStrictSenderProfileValidator(), clockValue, []);
}
