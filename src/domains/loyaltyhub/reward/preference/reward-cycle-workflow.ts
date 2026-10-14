import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardCycleEngine, defaultRewardCycleEngine } from "./reward-cycle-engine.js";
import { RewardCycleValidator, defaultRewardCycleValidator } from "./reward-cycle-rules.js";
import { RewardCycleStore } from "./reward-cycle-store.js";

/** Moves reward cycles through their life cycle and keeps a journal of what it did. */
export class RewardCycleManager {
  store: RewardCycleStore;
  validator: RewardCycleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardCycleEngine;

  constructor(
    store: RewardCycleStore,
    validator: RewardCycleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardCycleEngine,
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
      throw new Error(`reward cycle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward cycle ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward cycle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newRewardCycleManager(store: RewardCycleStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardCycleManager {
  return new RewardCycleManager(
    store,
    defaultRewardCycleValidator(),
    clockValue,
    [],
    defaultRewardCycleEngine(flagsValue),
  );
}
