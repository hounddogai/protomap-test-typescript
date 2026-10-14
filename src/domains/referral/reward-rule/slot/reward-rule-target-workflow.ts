import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardRuleTargetEngine, defaultRewardRuleTargetEngine } from "./reward-rule-target-engine.js";
import { RewardRuleTargetValidator, defaultRewardRuleTargetValidator } from "./reward-rule-target-rules.js";
import { RewardRuleTargetStore } from "./reward-rule-target-store.js";

/** Moves reward rule targets through their life cycle and keeps a journal of what it did. */
export class RewardRuleTargetService {
  store: RewardRuleTargetStore;
  validator: RewardRuleTargetValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleTargetEngine;

  constructor(
    store: RewardRuleTargetStore,
    validator: RewardRuleTargetValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleTargetEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule target ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule target ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule target ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRewardRuleTargetService(store: RewardRuleTargetStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardRuleTargetService {
  return new RewardRuleTargetService(
    store,
    defaultRewardRuleTargetValidator(),
    clockValue,
    [],
    defaultRewardRuleTargetEngine(flagsValue),
  );
}
