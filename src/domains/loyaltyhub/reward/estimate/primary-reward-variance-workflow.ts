import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { PrimaryRewardVarianceEngine, defaultPrimaryRewardVarianceEngine } from "./primary-reward-variance-engine.js";
import {
  PrimaryRewardVarianceValidator,
  defaultPrimaryRewardVarianceValidator,
} from "./primary-reward-variance-rules.js";
import { PrimaryRewardVarianceStore } from "./primary-reward-variance-store.js";

/** Moves primary reward variances through their life cycle and keeps a journal of what it did. */
export class PrimaryRewardVarianceCoordinator {
  store: PrimaryRewardVarianceStore;
  validator: PrimaryRewardVarianceValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimaryRewardVarianceEngine;

  constructor(
    store: PrimaryRewardVarianceStore,
    validator: PrimaryRewardVarianceValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimaryRewardVarianceEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary reward variance ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary reward variance ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary reward variance ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPrimaryRewardVarianceCoordinator(store: PrimaryRewardVarianceStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimaryRewardVarianceCoordinator {
  return new PrimaryRewardVarianceCoordinator(
    store,
    defaultPrimaryRewardVarianceValidator(),
    clockValue,
    [],
    defaultPrimaryRewardVarianceEngine(flagsValue),
  );
}
