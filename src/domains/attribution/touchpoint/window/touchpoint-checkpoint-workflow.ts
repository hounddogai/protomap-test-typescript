import * as clock from "../../../../kit/clock.js";
import { TouchpointCheckpointEngine, defaultTouchpointCheckpointEngine } from "./touchpoint-checkpoint-engine.js";
import {
  TouchpointCheckpointValidator,
  defaultTouchpointCheckpointValidator,
} from "./touchpoint-checkpoint-rules.js";
import { TouchpointCheckpointStore } from "./touchpoint-checkpoint-store.js";

/** Moves touchpoint checkpoints through their life cycle and keeps a journal of what it did. */
export class TouchpointCheckpointCoordinator {
  store: TouchpointCheckpointStore;
  validator: TouchpointCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TouchpointCheckpointEngine;

  constructor(
    store: TouchpointCheckpointStore,
    validator: TouchpointCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TouchpointCheckpointEngine,
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
      throw new Error(`touchpoint checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`touchpoint checkpoint ${code} not found`);
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
      throw new Error(`touchpoint checkpoint ${code} not found`);
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

export function newTouchpointCheckpointCoordinator(store: TouchpointCheckpointStore, clockValue: clock.Clock): TouchpointCheckpointCoordinator {
  return new TouchpointCheckpointCoordinator(
    store,
    defaultTouchpointCheckpointValidator(),
    clockValue,
    [],
    defaultTouchpointCheckpointEngine(),
  );
}
