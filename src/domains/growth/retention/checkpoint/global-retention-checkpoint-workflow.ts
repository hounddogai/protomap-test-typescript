import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  GlobalRetentionCheckpointEngine,
  defaultGlobalRetentionCheckpointEngine,
} from "./global-retention-checkpoint-engine.js";
import {
  GlobalRetentionCheckpointValidator,
  defaultGlobalRetentionCheckpointValidator,
} from "./global-retention-checkpoint-rules.js";
import { GlobalRetentionCheckpointStore } from "./global-retention-checkpoint-store.js";

/** Moves global retention checkpoints through their life cycle and keeps a journal of what it did. */
export class GlobalRetentionCheckpointCoordinator {
  store: GlobalRetentionCheckpointStore;
  validator: GlobalRetentionCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalRetentionCheckpointEngine;

  constructor(
    store: GlobalRetentionCheckpointStore,
    validator: GlobalRetentionCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalRetentionCheckpointEngine,
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
      throw new Error(`global retention checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global retention checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global retention checkpoint ${code} not found`);
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

export function newGlobalRetentionCheckpointCoordinator(store: GlobalRetentionCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalRetentionCheckpointCoordinator {
  return new GlobalRetentionCheckpointCoordinator(
    store,
    defaultGlobalRetentionCheckpointValidator(),
    clockValue,
    [],
    defaultGlobalRetentionCheckpointEngine(flagsValue),
  );
}
