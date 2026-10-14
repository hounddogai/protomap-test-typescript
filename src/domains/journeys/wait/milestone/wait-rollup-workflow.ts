import * as clock from "../../../../kit/clock.js";
import { WaitRollupEngine, defaultWaitRollupEngine } from "./wait-rollup-engine.js";
import { WaitRollupValidator, defaultWaitRollupValidator } from "./wait-rollup-rules.js";
import { WaitRollupStore } from "./wait-rollup-store.js";

/** Moves wait rollups through their life cycle and keeps a journal of what it did. */
export class WaitRollupService {
  store: WaitRollupStore;
  validator: WaitRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitRollupEngine;

  constructor(
    store: WaitRollupStore,
    validator: WaitRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitRollupEngine,
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
      throw new Error(`wait rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("scheduled");
    this.store.save(item);
    this.note(`${code} is scheduled`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("cancelled");
    this.store.save(item);
    this.note(`${code} is cancelled: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait rollup ${code} not found`);
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

export function newWaitRollupService(store: WaitRollupStore, clockValue: clock.Clock): WaitRollupService {
  return new WaitRollupService(store, defaultWaitRollupValidator(), clockValue, [], defaultWaitRollupEngine());
}
