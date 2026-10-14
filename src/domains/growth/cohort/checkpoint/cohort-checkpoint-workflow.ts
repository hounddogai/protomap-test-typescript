import * as clock from "../../../../kit/clock.js";
import { CohortCheckpointEngine, defaultCohortCheckpointEngine } from "./cohort-checkpoint-engine.js";
import { CohortCheckpointValidator, defaultCohortCheckpointValidator } from "./cohort-checkpoint-rules.js";
import { CohortCheckpointStore } from "./cohort-checkpoint-store.js";

/** Moves cohort checkpoints through their life cycle and keeps a journal of what it did. */
export class CohortCheckpointDesk {
  store: CohortCheckpointStore;
  validator: CohortCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CohortCheckpointEngine;

  constructor(
    store: CohortCheckpointStore,
    validator: CohortCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CohortCheckpointEngine,
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
      throw new Error(`cohort checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`cohort checkpoint ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newCohortCheckpointDesk(store: CohortCheckpointStore, clockValue: clock.Clock): CohortCheckpointDesk {
  return new CohortCheckpointDesk(
    store,
    defaultCohortCheckpointValidator(),
    clockValue,
    [],
    defaultCohortCheckpointEngine(),
  );
}
