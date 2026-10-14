import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardPlanEngine, defaultRewardPlanEngine } from "./reward-plan-engine.js";
import { RewardPlanValidator, defaultRewardPlanValidator } from "./reward-plan-rules.js";
import { RewardPlanStore } from "./reward-plan-store.js";

/** Moves reward plans through their life cycle and keeps a journal of what it did. */
export class RewardPlanService {
  store: RewardPlanStore;
  validator: RewardPlanValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardPlanEngine;

  constructor(
    store: RewardPlanStore,
    validator: RewardPlanValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardPlanEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward plan ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward plan ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward plan ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newRewardPlanService(store: RewardPlanStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardPlanService {
  return new RewardPlanService(
    store,
    defaultRewardPlanValidator(),
    clockValue,
    [],
    defaultRewardPlanEngine(flagsValue),
  );
}
