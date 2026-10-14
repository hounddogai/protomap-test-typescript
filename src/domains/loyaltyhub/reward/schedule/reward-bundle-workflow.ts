import * as clock from "../../../../kit/clock.js";
import { RewardBundleEngine, defaultRewardBundleEngine } from "./reward-bundle-engine.js";
import { RewardBundleValidator, defaultRewardBundleValidator } from "./reward-bundle-rules.js";
import { RewardBundleStore } from "./reward-bundle-store.js";

/** Moves reward bundles through their life cycle and keeps a journal of what it did. */
export class RewardBundleWorkflow {
  store: RewardBundleStore;
  validator: RewardBundleValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RewardBundleEngine;

  constructor(
    store: RewardBundleStore,
    validator: RewardBundleValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RewardBundleEngine,
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
      throw new Error(`reward bundle ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reward bundle ${code} not found`);
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
      throw new Error(`reward bundle ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
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

export function newRewardBundleWorkflow(store: RewardBundleStore, clockValue: clock.Clock): RewardBundleWorkflow {
  return new RewardBundleWorkflow(store, defaultRewardBundleValidator(), clockValue, [], defaultRewardBundleEngine());
}
