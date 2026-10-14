import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  SeasonalWarmupCheckpointEngine,
  defaultSeasonalWarmupCheckpointEngine,
} from "./seasonal-warmup-checkpoint-engine.js";
import {
  SeasonalWarmupCheckpointValidator,
  defaultSeasonalWarmupCheckpointValidator,
} from "./seasonal-warmup-checkpoint-rules.js";
import { SeasonalWarmupCheckpointStore } from "./seasonal-warmup-checkpoint-store.js";

/** Moves seasonal warmup checkpoints through their life cycle and keeps a journal of what it did. */
export class SeasonalWarmupCheckpointService {
  store: SeasonalWarmupCheckpointStore;
  validator: SeasonalWarmupCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SeasonalWarmupCheckpointEngine;

  constructor(
    store: SeasonalWarmupCheckpointStore,
    validator: SeasonalWarmupCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SeasonalWarmupCheckpointEngine,
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
      throw new Error(`seasonal warmup checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal warmup checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`seasonal warmup checkpoint ${code} not found`);
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

export function newSeasonalWarmupCheckpointService(store: SeasonalWarmupCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): SeasonalWarmupCheckpointService {
  return new SeasonalWarmupCheckpointService(
    store,
    defaultSeasonalWarmupCheckpointValidator(),
    clockValue,
    [],
    defaultSeasonalWarmupCheckpointEngine(flagsValue),
  );
}
