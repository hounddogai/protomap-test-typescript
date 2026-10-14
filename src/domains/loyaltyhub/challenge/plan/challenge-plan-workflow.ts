import * as clock from "../../../../kit/clock.js";
import { ChallengePlanValidator, defaultChallengePlanValidator } from "./challenge-plan-rules.js";
import { ChallengePlanStore } from "./challenge-plan-store.js";

/** Moves challenge plans through their life cycle and keeps a journal of what it did. */
export class ChallengePlanDesk {
  store: ChallengePlanStore;
  validator: ChallengePlanValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ChallengePlanStore,
    validator: ChallengePlanValidator,
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
      throw new Error(`challenge plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`challenge plan ${code} not found`);
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
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newChallengePlanDesk(store: ChallengePlanStore, clockValue: clock.Clock): ChallengePlanDesk {
  return new ChallengePlanDesk(store, defaultChallengePlanValidator(), clockValue, []);
}
