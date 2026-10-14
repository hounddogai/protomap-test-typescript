import * as clock from "../../../../kit/clock.js";
import {
  WeightedEnrollmentMilestoneValidator,
  defaultWeightedEnrollmentMilestoneValidator,
} from "./weighted-enrollment-milestone-rules.js";
import { WeightedEnrollmentMilestoneStore } from "./weighted-enrollment-milestone-store.js";

/** Moves weighted enrollment milestones through their life cycle and keeps a journal of what it did. */
export class WeightedEnrollmentMilestoneCoordinator {
  store: WeightedEnrollmentMilestoneStore;
  validator: WeightedEnrollmentMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedEnrollmentMilestoneStore,
    validator: WeightedEnrollmentMilestoneValidator,
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
      throw new Error(`weighted enrollment milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted enrollment milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedEnrollmentMilestoneCoordinator(store: WeightedEnrollmentMilestoneStore, clockValue: clock.Clock): WeightedEnrollmentMilestoneCoordinator {
  return new WeightedEnrollmentMilestoneCoordinator(
    store,
    defaultWeightedEnrollmentMilestoneValidator(),
    clockValue,
    [],
  );
}
