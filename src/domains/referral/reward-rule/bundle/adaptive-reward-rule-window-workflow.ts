import * as clock from "../../../../kit/clock.js";
import {
  AdaptiveRewardRuleWindowValidator,
  defaultAdaptiveRewardRuleWindowValidator,
} from "./adaptive-reward-rule-window-rules.js";
import { AdaptiveRewardRuleWindowStore } from "./adaptive-reward-rule-window-store.js";

/** Moves adaptive reward rule windows through their life cycle and keeps a journal of what it did. */
export class AdaptiveRewardRuleWindowService {
  store: AdaptiveRewardRuleWindowStore;
  validator: AdaptiveRewardRuleWindowValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: AdaptiveRewardRuleWindowStore,
    validator: AdaptiveRewardRuleWindowValidator,
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
      throw new Error(`adaptive reward rule window ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`adaptive reward rule window ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
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

export function newAdaptiveRewardRuleWindowService(store: AdaptiveRewardRuleWindowStore, clockValue: clock.Clock): AdaptiveRewardRuleWindowService {
  return new AdaptiveRewardRuleWindowService(store, defaultAdaptiveRewardRuleWindowValidator(), clockValue, []);
}
