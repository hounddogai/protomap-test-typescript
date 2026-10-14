import * as clock from "../../../../kit/clock.js";
import { RewardRuleDraftValidator, defaultRewardRuleDraftValidator } from "./reward-rule-draft-rules.js";
import { RewardRuleDraftStore } from "./reward-rule-draft-store.js";

/** Moves reward rule drafts through their life cycle and keeps a journal of what it did. */
export class RewardRuleDraftWorkflow {
  store: RewardRuleDraftStore;
  validator: RewardRuleDraftValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RewardRuleDraftStore,
    validator: RewardRuleDraftValidator,
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
      throw new Error(`reward rule draft ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule draft ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newRewardRuleDraftWorkflow(store: RewardRuleDraftStore, clockValue: clock.Clock): RewardRuleDraftWorkflow {
  return new RewardRuleDraftWorkflow(store, defaultRewardRuleDraftValidator(), clockValue, []);
}
