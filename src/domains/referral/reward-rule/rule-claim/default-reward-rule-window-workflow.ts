import * as clock from "../../../../kit/clock.js";
import {
  DefaultRewardRuleWindowValidator,
  defaultDefaultRewardRuleWindowValidator,
} from "./default-reward-rule-window-rules.js";
import { DefaultRewardRuleWindowStore } from "./default-reward-rule-window-store.js";

/** Moves default reward rule windows through their life cycle and keeps a journal of what it did. */
export class DefaultRewardRuleWindowService {
  store: DefaultRewardRuleWindowStore;
  validator: DefaultRewardRuleWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: DefaultRewardRuleWindowStore,
    validator: DefaultRewardRuleWindowValidator,
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
      throw new Error(`default reward rule window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`default reward rule window ${code} not found`);
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

export function newDefaultRewardRuleWindowService(store: DefaultRewardRuleWindowStore, clockValue: clock.Clock): DefaultRewardRuleWindowService {
  return new DefaultRewardRuleWindowService(store, defaultDefaultRewardRuleWindowValidator(), clockValue, []);
}
