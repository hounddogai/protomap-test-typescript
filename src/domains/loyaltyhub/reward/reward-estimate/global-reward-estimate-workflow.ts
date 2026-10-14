import * as clock from "../../../../kit/clock.js";
import {
  GlobalRewardEstimateValidator,
  defaultGlobalRewardEstimateValidator,
} from "./global-reward-estimate-rules.js";
import { GlobalRewardEstimateStore } from "./global-reward-estimate-store.js";

/** Moves global reward estimates through their life cycle and keeps a journal of what it did. */
export class GlobalRewardEstimateManager {
  store: GlobalRewardEstimateStore;
  validator: GlobalRewardEstimateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: GlobalRewardEstimateStore,
    validator: GlobalRewardEstimateValidator,
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
      throw new Error(`global reward estimate ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global reward estimate ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  reviewStale(cutoff: number): number {
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

export function newGlobalRewardEstimateManager(store: GlobalRewardEstimateStore, clockValue: clock.Clock): GlobalRewardEstimateManager {
  return new GlobalRewardEstimateManager(store, defaultGlobalRewardEstimateValidator(), clockValue, []);
}
