import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RewardClaimEngine, defaultRewardClaimEngine } from "./reward-claim-engine.js";
import { RewardClaimValidator, defaultRewardClaimValidator } from "./reward-claim-rules.js";
import { RewardClaimStore } from "./reward-claim-store.js";

/** Moves reward claims through their life cycle and keeps a journal of what it did. */
export class RewardClaimManager {
  store: RewardClaimStore;
  validator: RewardClaimValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardClaimEngine;

  constructor(
    store: RewardClaimStore,
    validator: RewardClaimValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardClaimEngine,
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
      throw new Error(`reward claim ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward claim ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward claim ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newRewardClaimManager(store: RewardClaimStore, clockValue: clock.Clock, flagsValue: flags.Registry): RewardClaimManager {
  return new RewardClaimManager(
    store,
    defaultRewardClaimValidator(),
    clockValue,
    [],
    defaultRewardClaimEngine(flagsValue),
  );
}
