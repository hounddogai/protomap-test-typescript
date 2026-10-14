import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardRuleBatchEngine, defaultRewardRuleBatchEngine } from "./reward-rule-batch-engine.js";
import { RewardRuleBatchValidator, defaultRewardRuleBatchValidator } from "./reward-rule-batch-rules.js";
import { RewardRuleBatchStore } from "./reward-rule-batch-store.js";

/** Moves reward rule batches through their life cycle and keeps a journal of what it did. */
export class RewardRuleBatchCoordinator {
  store: RewardRuleBatchStore;
  validator: RewardRuleBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardRuleBatchEngine;

  constructor(
    store: RewardRuleBatchStore,
    validator: RewardRuleBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardRuleBatchEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward rule batch ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newRewardRuleBatchCoordinator(store: RewardRuleBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardRuleBatchCoordinator {
  return new RewardRuleBatchCoordinator(
    store,
    defaultRewardRuleBatchValidator(),
    clockValue,
    [],
    defaultRewardRuleBatchEngine(flagsValue),
  );
}
