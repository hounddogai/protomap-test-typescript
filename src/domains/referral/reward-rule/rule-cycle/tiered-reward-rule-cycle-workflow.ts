import * as clock from "../../../../kit/clock.js";
import {
  TieredRewardRuleCycleValidator,
  defaultTieredRewardRuleCycleValidator,
} from "./tiered-reward-rule-cycle-rules.js";
import { TieredRewardRuleCycleStore } from "./tiered-reward-rule-cycle-store.js";

/** Moves tiered reward rule cycles through their life cycle and keeps a journal of what it did. */
export class TieredRewardRuleCycleCoordinator {
  store: TieredRewardRuleCycleStore;
  validator: TieredRewardRuleCycleValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: TieredRewardRuleCycleStore,
    validator: TieredRewardRuleCycleValidator,
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
      throw new Error(`tiered reward rule cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered reward rule cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newTieredRewardRuleCycleCoordinator(store: TieredRewardRuleCycleStore, clockValue: clock.Clock): TieredRewardRuleCycleCoordinator {
  return new TieredRewardRuleCycleCoordinator(store, defaultTieredRewardRuleCycleValidator(), clockValue, []);
}
