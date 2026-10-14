import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  TieredSuppressionCheckpointEngine,
  defaultTieredSuppressionCheckpointEngine,
} from "./tiered-suppression-checkpoint-engine.js";
import {
  TieredSuppressionCheckpointValidator,
  defaultTieredSuppressionCheckpointValidator,
} from "./tiered-suppression-checkpoint-rules.js";
import { TieredSuppressionCheckpointStore } from "./tiered-suppression-checkpoint-store.js";

/** Moves tiered suppression checkpoints through their life cycle and keeps a journal of what it did. */
export class TieredSuppressionCheckpointManager {
  store: TieredSuppressionCheckpointStore;
  validator: TieredSuppressionCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredSuppressionCheckpointEngine;

  constructor(
    store: TieredSuppressionCheckpointStore,
    validator: TieredSuppressionCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredSuppressionCheckpointEngine,
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
      throw new Error(`tiered suppression checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered suppression checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered suppression checkpoint ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.sendAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newTieredSuppressionCheckpointManager(store: TieredSuppressionCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): TieredSuppressionCheckpointManager {
  return new TieredSuppressionCheckpointManager(
    store,
    defaultTieredSuppressionCheckpointValidator(),
    clockValue,
    [],
    defaultTieredSuppressionCheckpointEngine(flagsValue),
  );
}
