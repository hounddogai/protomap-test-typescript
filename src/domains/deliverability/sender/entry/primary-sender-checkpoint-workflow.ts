import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import {
  PrimarySenderCheckpointEngine,
  defaultPrimarySenderCheckpointEngine,
} from "./primary-sender-checkpoint-engine.js";
import {
  PrimarySenderCheckpointValidator,
  defaultPrimarySenderCheckpointValidator,
} from "./primary-sender-checkpoint-rules.js";
import { PrimarySenderCheckpointStore } from "./primary-sender-checkpoint-store.js";

/** Moves primary sender checkpoints through their life cycle and keeps a journal of what it did. */
export class PrimarySenderCheckpointService {
  store: PrimarySenderCheckpointStore;
  validator: PrimarySenderCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PrimarySenderCheckpointEngine;

  constructor(
    store: PrimarySenderCheckpointStore,
    validator: PrimarySenderCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PrimarySenderCheckpointEngine,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary sender checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary sender checkpoint ${code} not found`);
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
      throw new Error(`primary sender checkpoint ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newPrimarySenderCheckpointService(store: PrimarySenderCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): PrimarySenderCheckpointService {
  return new PrimarySenderCheckpointService(
    store,
    defaultPrimarySenderCheckpointValidator(),
    clockValue,
    [],
    defaultPrimarySenderCheckpointEngine(flagsValue),
  );
}
