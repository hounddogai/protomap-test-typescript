import * as clock from "../../../../kit/clock.js";
import { LevelBatchEngine, defaultLevelBatchEngine } from "./level-batch-engine.js";
import { LevelBatchValidator, defaultLevelBatchValidator } from "./level-batch-rules.js";
import { LevelBatchStore } from "./level-batch-store.js";

/** Moves level batches through their life cycle and keeps a journal of what it did. */
export class LevelBatchCoordinator {
  store: LevelBatchStore;
  validator: LevelBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: LevelBatchEngine;

  constructor(
    store: LevelBatchStore,
    validator: LevelBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: LevelBatchEngine,
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
      throw new Error(`level batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`level batch ${code} not found`);
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
      throw new Error(`level batch ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newLevelBatchCoordinator(store: LevelBatchStore, clockValue: clock.Clock): LevelBatchCoordinator {
  return new LevelBatchCoordinator(store, defaultLevelBatchValidator(), clockValue, [], defaultLevelBatchEngine());
}
