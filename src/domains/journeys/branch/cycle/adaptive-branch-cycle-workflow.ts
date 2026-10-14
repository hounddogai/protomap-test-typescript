import * as clock from "../../../../kit/clock.js";
import { AdaptiveBranchCycleValidator, defaultAdaptiveBranchCycleValidator } from "./adaptive-branch-cycle-rules.js";
import { AdaptiveBranchCycleStore } from "./adaptive-branch-cycle-store.js";

/** Moves adaptive branch cycles through their life cycle and keeps a journal of what it did. */
export class AdaptiveBranchCycleCoordinator {
  store: AdaptiveBranchCycleStore;
  validator: AdaptiveBranchCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveBranchCycleStore,
    validator: AdaptiveBranchCycleValidator,
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
      throw new Error(`adaptive branch cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive branch cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newAdaptiveBranchCycleCoordinator(store: AdaptiveBranchCycleStore, clockValue: clock.Clock): AdaptiveBranchCycleCoordinator {
  return new AdaptiveBranchCycleCoordinator(store, defaultAdaptiveBranchCycleValidator(), clockValue, []);
}
