import * as clock from "../../../../kit/clock.js";
import {
  SeasonalRewardRuleMilestoneValidator,
  defaultSeasonalRewardRuleMilestoneValidator,
} from "./seasonal-reward-rule-milestone-rules.js";
import { SeasonalRewardRuleMilestoneStore } from "./seasonal-reward-rule-milestone-store.js";

/** Moves seasonal reward rule milestones through their life cycle and keeps a journal of what it did. */
export class SeasonalRewardRuleMilestoneCoordinator {
  store: SeasonalRewardRuleMilestoneStore;
  validator: SeasonalRewardRuleMilestoneValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: SeasonalRewardRuleMilestoneStore,
    validator: SeasonalRewardRuleMilestoneValidator,
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
      throw new Error(`seasonal reward rule milestone ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal reward rule milestone ${code} not found`);
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
      if (item.updatedAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newSeasonalRewardRuleMilestoneCoordinator(store: SeasonalRewardRuleMilestoneStore, clockValue: clock.Clock): SeasonalRewardRuleMilestoneCoordinator {
  return new SeasonalRewardRuleMilestoneCoordinator(
    store,
    defaultSeasonalRewardRuleMilestoneValidator(),
    clockValue,
    [],
  );
}
