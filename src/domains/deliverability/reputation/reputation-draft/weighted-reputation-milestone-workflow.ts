import * as clock from "../../../../kit/clock.js";
import {
  WeightedReputationMilestoneValidator,
  defaultWeightedReputationMilestoneValidator,
} from "./weighted-reputation-milestone-rules.js";
import { WeightedReputationMilestoneStore } from "./weighted-reputation-milestone-store.js";

/** Moves weighted reputation milestones through their life cycle and keeps a journal of what it did. */
export class WeightedReputationMilestoneWorkflow {
  store: WeightedReputationMilestoneStore;
  validator: WeightedReputationMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedReputationMilestoneStore,
    validator: WeightedReputationMilestoneValidator,
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
      throw new Error(`weighted reputation milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted reputation milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newWeightedReputationMilestoneWorkflow(store: WeightedReputationMilestoneStore, clockValue: clock.Clock): WeightedReputationMilestoneWorkflow {
  return new WeightedReputationMilestoneWorkflow(store, defaultWeightedReputationMilestoneValidator(), clockValue, []);
}
