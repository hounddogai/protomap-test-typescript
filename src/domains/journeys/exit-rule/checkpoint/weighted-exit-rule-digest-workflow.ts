import * as clock from "../../../../kit/clock.js";
import {
  WeightedExitRuleDigestValidator,
  defaultWeightedExitRuleDigestValidator,
} from "./weighted-exit-rule-digest-rules.js";
import { WeightedExitRuleDigestStore } from "./weighted-exit-rule-digest-store.js";

/** Moves weighted exit rule digests through their life cycle and keeps a journal of what it did. */
export class WeightedExitRuleDigestCoordinator {
  store: WeightedExitRuleDigestStore;
  validator: WeightedExitRuleDigestValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: WeightedExitRuleDigestStore,
    validator: WeightedExitRuleDigestValidator,
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
      throw new Error(`weighted exit rule digest ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`weighted exit rule digest ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  scan(cutoff: number): number {
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

export function newWeightedExitRuleDigestCoordinator(store: WeightedExitRuleDigestStore, clockValue: clock.Clock): WeightedExitRuleDigestCoordinator {
  return new WeightedExitRuleDigestCoordinator(store, defaultWeightedExitRuleDigestValidator(), clockValue, []);
}
