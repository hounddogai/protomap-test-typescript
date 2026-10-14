import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StreakCheckpointEngine, defaultStreakCheckpointEngine } from "./streak-checkpoint-engine.js";
import { StreakCheckpointValidator, defaultStreakCheckpointValidator } from "./streak-checkpoint-rules.js";
import { StreakCheckpointStore } from "./streak-checkpoint-store.js";

/** Moves streak checkpoints through their life cycle and keeps a journal of what it did. */
export class StreakCheckpointManager {
  store: StreakCheckpointStore;
  validator: StreakCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakCheckpointEngine;

  constructor(
    store: StreakCheckpointStore,
    validator: StreakCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakCheckpointEngine,
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
      throw new Error(`streak checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak checkpoint ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
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

export function newStreakCheckpointManager(store: StreakCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): StreakCheckpointManager {
  return new StreakCheckpointManager(
    store,
    defaultStreakCheckpointValidator(),
    clockValue,
    [],
    defaultStreakCheckpointEngine(flagsValue),
  );
}
