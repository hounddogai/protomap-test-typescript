import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { TieredPathCheckpointEngine, defaultTieredPathCheckpointEngine } from "./tiered-path-checkpoint-engine.js";
import {
  TieredPathCheckpointValidator,
  defaultTieredPathCheckpointValidator,
} from "./tiered-path-checkpoint-rules.js";
import { TieredPathCheckpointStore } from "./tiered-path-checkpoint-store.js";

/** Moves tiered path checkpoints through their life cycle and keeps a journal of what it did. */
export class TieredPathCheckpointService {
  store: TieredPathCheckpointStore;
  validator: TieredPathCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredPathCheckpointEngine;

  constructor(
    store: TieredPathCheckpointStore,
    validator: TieredPathCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredPathCheckpointEngine,
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
      throw new Error(`tiered path checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered path checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered path checkpoint ${code} not found`);
    }
    const result = this.engine.price(item);
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

export function newTieredPathCheckpointService(store: TieredPathCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredPathCheckpointService {
  return new TieredPathCheckpointService(
    store,
    defaultTieredPathCheckpointValidator(),
    clockValue,
    [],
    defaultTieredPathCheckpointEngine(flagsValue),
  );
}
