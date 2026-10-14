import * as clock from "../../../../kit/clock.js";
import { RewardTargetValidator, defaultRewardTargetValidator } from "./reward-target-rules.js";
import { RewardTargetStore } from "./reward-target-store.js";

/** Moves reward targets through their life cycle and keeps a journal of what it did. */
export class RewardTargetManager {
  store: RewardTargetStore;
  validator: RewardTargetValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: RewardTargetStore,
    validator: RewardTargetValidator,
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
      throw new Error(`reward target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
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

export function newRewardTargetManager(store: RewardTargetStore, clockValue: clock.Clock): RewardTargetManager {
  return new RewardTargetManager(store, defaultRewardTargetValidator(), clockValue, []);
}
