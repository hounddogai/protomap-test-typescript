import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { LevelRollupEngine, defaultLevelRollupEngine } from "./level-rollup-engine.js";
import { LevelRollupValidator, defaultLevelRollupValidator } from "./level-rollup-rules.js";
import { LevelRollupStore } from "./level-rollup-store.js";

/** Moves level rollups through their life cycle and keeps a journal of what it did. */
export class LevelRollupCoordinator {
  store: LevelRollupStore;
  validator: LevelRollupValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LevelRollupEngine;

  constructor(
    store: LevelRollupStore,
    validator: LevelRollupValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LevelRollupEngine,
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
      throw new Error(`level rollup ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level rollup ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level rollup ${code} not found`);
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

export function newLevelRollupCoordinator(store: LevelRollupStore, clockValue: clock.Clock, flagsValue: flags.Registry): LevelRollupCoordinator {
  return new LevelRollupCoordinator(
    store,
    defaultLevelRollupValidator(),
    clockValue,
    [],
    defaultLevelRollupEngine(flagsValue),
  );
}
