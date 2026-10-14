import * as clock from "../../../../kit/clock.js";
import { PrimaryStreakPlanValidator, defaultPrimaryStreakPlanValidator } from "./primary-streak-plan-rules.js";
import { PrimaryStreakPlanStore } from "./primary-streak-plan-store.js";

/** Moves primary streak plans through their life cycle and keeps a journal of what it did. */
export class PrimaryStreakPlanDesk {
  store: PrimaryStreakPlanStore;
  validator: PrimaryStreakPlanValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryStreakPlanStore,
    validator: PrimaryStreakPlanValidator,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary streak plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary streak plan ${code} not found`);
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
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPrimaryStreakPlanDesk(store: PrimaryStreakPlanStore, clockValue: clock.Clock): PrimaryStreakPlanDesk {
  return new PrimaryStreakPlanDesk(store, defaultPrimaryStreakPlanValidator(), clockValue, []);
}
