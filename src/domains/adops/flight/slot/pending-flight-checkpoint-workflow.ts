import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PendingFlightCheckpointEngine,
  defaultPendingFlightCheckpointEngine,
} from "./pending-flight-checkpoint-engine.js";
import {
  PendingFlightCheckpointValidator,
  defaultPendingFlightCheckpointValidator,
} from "./pending-flight-checkpoint-rules.js";
import { PendingFlightCheckpointStore } from "./pending-flight-checkpoint-store.js";

/** Moves pending flight checkpoints through their life cycle and keeps a journal of what it did. */
export class PendingFlightCheckpointManager {
  store: PendingFlightCheckpointStore;
  validator: PendingFlightCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingFlightCheckpointEngine;

  constructor(
    store: PendingFlightCheckpointStore,
    validator: PendingFlightCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingFlightCheckpointEngine,
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
      throw new Error(`pending flight checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending flight checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending flight checkpoint ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingFlightCheckpointManager(store: PendingFlightCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): PendingFlightCheckpointManager {
  return new PendingFlightCheckpointManager(
    store,
    defaultPendingFlightCheckpointValidator(),
    clockValue,
    [],
    defaultPendingFlightCheckpointEngine(flagsValue),
  );
}
