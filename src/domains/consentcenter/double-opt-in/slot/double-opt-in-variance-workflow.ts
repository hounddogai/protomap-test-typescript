import * as clock from "../../../../kit/clock.js";
import { DoubleOptInVarianceValidator, defaultDoubleOptInVarianceValidator } from "./double-opt-in-variance-rules.js";
import { DoubleOptInVarianceStore } from "./double-opt-in-variance-store.js";

/** Moves double opt in variances through their life cycle and keeps a journal of what it did. */
export class DoubleOptInVarianceManager {
  store: DoubleOptInVarianceStore;
  validator: DoubleOptInVarianceValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DoubleOptInVarianceStore,
    validator: DoubleOptInVarianceValidator,
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
      throw new Error(`double opt in variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`double opt in variance ${code} not found`);
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
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDoubleOptInVarianceManager(store: DoubleOptInVarianceStore, clockValue: clock.Clock): DoubleOptInVarianceManager {
  return new DoubleOptInVarianceManager(store, defaultDoubleOptInVarianceValidator(), clockValue, []);
}
