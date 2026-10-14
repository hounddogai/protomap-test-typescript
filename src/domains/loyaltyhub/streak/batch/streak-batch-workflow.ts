import * as clock from "../../../../kit/clock.js";
import { StreakBatchEngine, defaultStreakBatchEngine } from "./streak-batch-engine.js";
import { StreakBatchValidator, defaultStreakBatchValidator } from "./streak-batch-rules.js";
import { StreakBatchStore } from "./streak-batch-store.js";

/** Moves streak batches through their life cycle and keeps a journal of what it did. */
export class StreakBatchCoordinator {
  store: StreakBatchStore;
  validator: StreakBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakBatchEngine;

  constructor(
    store: StreakBatchStore,
    validator: StreakBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakBatchEngine,
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
      throw new Error(`streak batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak batch ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newStreakBatchCoordinator(store: StreakBatchStore, clockValue: clock.Clock): StreakBatchCoordinator {
  return new StreakBatchCoordinator(store, defaultStreakBatchValidator(), clockValue, [], defaultStreakBatchEngine());
}
