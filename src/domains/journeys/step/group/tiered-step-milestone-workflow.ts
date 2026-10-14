import * as clock from "../../../../kit/clock.js";
import { TieredStepMilestoneValidator, defaultTieredStepMilestoneValidator } from "./tiered-step-milestone-rules.js";
import { TieredStepMilestoneStore } from "./tiered-step-milestone-store.js";

/** Moves tiered step milestones through their life cycle and keeps a journal of what it did. */
export class TieredStepMilestoneWorkflow {
  store: TieredStepMilestoneStore;
  validator: TieredStepMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredStepMilestoneStore,
    validator: TieredStepMilestoneValidator,
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
      throw new Error(`tiered step milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered step milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredStepMilestoneWorkflow(store: TieredStepMilestoneStore, clockValue: clock.Clock): TieredStepMilestoneWorkflow {
  return new TieredStepMilestoneWorkflow(store, defaultTieredStepMilestoneValidator(), clockValue, []);
}
