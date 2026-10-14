import * as clock from "../../../../kit/clock.js";
import { RewardRuleSegmentValidator, defaultRewardRuleSegmentValidator } from "./reward-rule-segment-rules.js";
import { RewardRuleSegmentStore } from "./reward-rule-segment-store.js";

/** Moves reward rule segments through their life cycle and keeps a journal of what it did. */
export class RewardRuleSegmentCoordinator {
  store: RewardRuleSegmentStore;
  validator: RewardRuleSegmentValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RewardRuleSegmentStore,
    validator: RewardRuleSegmentValidator,
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
      throw new Error(`reward rule segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRewardRuleSegmentCoordinator(store: RewardRuleSegmentStore, clockValue: clock.Clock): RewardRuleSegmentCoordinator {
  return new RewardRuleSegmentCoordinator(store, defaultRewardRuleSegmentValidator(), clockValue, []);
}
