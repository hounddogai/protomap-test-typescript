import * as clock from "../../../../kit/clock.js";
import { AdaptiveStreakClaimValidator, defaultAdaptiveStreakClaimValidator } from "./adaptive-streak-claim-rules.js";
import { AdaptiveStreakClaimStore } from "./adaptive-streak-claim-store.js";

/** Moves adaptive streak claims through their life cycle and keeps a journal of what it did. */
export class AdaptiveStreakClaimService {
  store: AdaptiveStreakClaimStore;
  validator: AdaptiveStreakClaimValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveStreakClaimStore,
    validator: AdaptiveStreakClaimValidator,
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
      throw new Error(`adaptive streak claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive streak claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newAdaptiveStreakClaimService(store: AdaptiveStreakClaimStore, clockValue: clock.Clock): AdaptiveStreakClaimService {
  return new AdaptiveStreakClaimService(store, defaultAdaptiveStreakClaimValidator(), clockValue, []);
}
