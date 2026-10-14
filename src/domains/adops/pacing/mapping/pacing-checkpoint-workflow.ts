import * as clock from "../../../../kit/clock.js";
import { PacingCheckpointEngine, defaultPacingCheckpointEngine } from "./pacing-checkpoint-engine.js";
import { PacingCheckpointValidator, defaultPacingCheckpointValidator } from "./pacing-checkpoint-rules.js";
import { PacingCheckpointStore } from "./pacing-checkpoint-store.js";

/** Moves pacing checkpoints through their life cycle and keeps a journal of what it did. */
export class PacingCheckpointDesk {
  store: PacingCheckpointStore;
  validator: PacingCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PacingCheckpointEngine;

  constructor(
    store: PacingCheckpointStore,
    validator: PacingCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PacingCheckpointEngine,
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
      throw new Error(`pacing checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pacing checkpoint ${code} not found`);
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

export function newPacingCheckpointDesk(store: PacingCheckpointStore, clockValue: clock.Clock): PacingCheckpointDesk {
  return new PacingCheckpointDesk(
    store,
    defaultPacingCheckpointValidator(),
    clockValue,
    [],
    defaultPacingCheckpointEngine(),
  );
}
