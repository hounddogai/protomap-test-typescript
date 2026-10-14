import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { StreakSegmentEngine, defaultStreakSegmentEngine } from "./streak-segment-engine.js";
import { StreakSegmentValidator, defaultStreakSegmentValidator } from "./streak-segment-rules.js";
import { StreakSegmentStore } from "./streak-segment-store.js";

/** Moves streak segments through their life cycle and keeps a journal of what it did. */
export class StreakSegmentService {
  store: StreakSegmentStore;
  validator: StreakSegmentValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StreakSegmentEngine;

  constructor(
    store: StreakSegmentStore,
    validator: StreakSegmentValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StreakSegmentEngine,
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
      throw new Error(`streak segment ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak segment ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`streak segment ${code} not found`);
    }
    const result = this.engine.compute(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newStreakSegmentService(store: StreakSegmentStore, clockValue: clock.Clock, flagsValue: flags.Registry): StreakSegmentService {
  return new StreakSegmentService(
    store,
    defaultStreakSegmentValidator(),
    clockValue,
    [],
    defaultStreakSegmentEngine(flagsValue),
  );
}
