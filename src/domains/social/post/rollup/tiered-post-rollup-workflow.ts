import * as clock from "../../../../kit/clock.js";
import { TieredPostRollupEngine, defaultTieredPostRollupEngine } from "./tiered-post-rollup-engine.js";
import { TieredPostRollupValidator, defaultTieredPostRollupValidator } from "./tiered-post-rollup-rules.js";
import { TieredPostRollupStore } from "./tiered-post-rollup-store.js";

/** Moves tiered post rollups through their life cycle and keeps a journal of what it did. */
export class TieredPostRollupManager {
  store: TieredPostRollupStore;
  validator: TieredPostRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredPostRollupEngine;

  constructor(
    store: TieredPostRollupStore,
    validator: TieredPostRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredPostRollupEngine,
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
      throw new Error(`tiered post rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered post rollup ${code} not found`);
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
      throw new Error(`tiered post rollup ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
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

export function newTieredPostRollupManager(store: TieredPostRollupStore, clockValue: clock.Clock): TieredPostRollupManager {
  return new TieredPostRollupManager(
    store,
    defaultTieredPostRollupValidator(),
    clockValue,
    [],
    defaultTieredPostRollupEngine(),
  );
}
