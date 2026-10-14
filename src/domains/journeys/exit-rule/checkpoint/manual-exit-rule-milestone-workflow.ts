import * as clock from "../../../../kit/clock.js";
import {
  ManualExitRuleMilestoneValidator,
  defaultManualExitRuleMilestoneValidator,
} from "./manual-exit-rule-milestone-rules.js";
import { ManualExitRuleMilestoneStore } from "./manual-exit-rule-milestone-store.js";

/** Moves manual exit rule milestones through their life cycle and keeps a journal of what it did. */
export class ManualExitRuleMilestoneDesk {
  store: ManualExitRuleMilestoneStore;
  validator: ManualExitRuleMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: ManualExitRuleMilestoneStore,
    validator: ManualExitRuleMilestoneValidator,
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
      throw new Error(`manual exit rule milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`manual exit rule milestone ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  sweep(cutoff: number): number {
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

export function newManualExitRuleMilestoneDesk(store: ManualExitRuleMilestoneStore, clockValue: clock.Clock): ManualExitRuleMilestoneDesk {
  return new ManualExitRuleMilestoneDesk(store, defaultManualExitRuleMilestoneValidator(), clockValue, []);
}
