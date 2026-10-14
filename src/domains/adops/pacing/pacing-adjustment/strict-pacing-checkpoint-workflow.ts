import * as clock from "../../../../kit/clock.js";
import {
  StrictPacingCheckpointEngine,
  defaultStrictPacingCheckpointEngine,
} from "./strict-pacing-checkpoint-engine.js";
import {
  StrictPacingCheckpointValidator,
  defaultStrictPacingCheckpointValidator,
} from "./strict-pacing-checkpoint-rules.js";
import { StrictPacingCheckpointStore } from "./strict-pacing-checkpoint-store.js";

/** Moves strict pacing checkpoints through their life cycle and keeps a journal of what it did. */
export class StrictPacingCheckpointManager {
  store: StrictPacingCheckpointStore;
  validator: StrictPacingCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: StrictPacingCheckpointEngine;

  constructor(
    store: StrictPacingCheckpointStore,
    validator: StrictPacingCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: StrictPacingCheckpointEngine,
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
      throw new Error(`strict pacing checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict pacing checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`strict pacing checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newStrictPacingCheckpointManager(store: StrictPacingCheckpointStore, clockValue: clock.Clock): StrictPacingCheckpointManager {
  return new StrictPacingCheckpointManager(
    store,
    defaultStrictPacingCheckpointValidator(),
    clockValue,
    [],
    defaultStrictPacingCheckpointEngine(),
  );
}
