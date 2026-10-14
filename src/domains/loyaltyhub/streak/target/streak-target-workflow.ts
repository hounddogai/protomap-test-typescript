import * as clock from "../../../../kit/clock.js";
import { StreakTargetValidator, defaultStreakTargetValidator } from "./streak-target-rules.js";
import { StreakTargetStore } from "./streak-target-store.js";

/** Moves streak targets through their life cycle and keeps a journal of what it did. */
export class StreakTargetService {
  store: StreakTargetStore;
  validator: StreakTargetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: StreakTargetStore,
    validator: StreakTargetValidator,
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
      throw new Error(`streak target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak target ${code} not found`);
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
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStreakTargetService(store: StreakTargetStore, clockValue: clock.Clock): StreakTargetService {
  return new StreakTargetService(store, defaultStreakTargetValidator(), clockValue, []);
}
