import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WaitCheckpointEngine, defaultWaitCheckpointEngine } from "./wait-checkpoint-engine.js";
import { WaitCheckpointValidator, defaultWaitCheckpointValidator } from "./wait-checkpoint-rules.js";
import { WaitCheckpointStore } from "./wait-checkpoint-store.js";

/** Moves wait checkpoints through their life cycle and keeps a journal of what it did. */
export class WaitCheckpointDesk {
  store: WaitCheckpointStore;
  validator: WaitCheckpointValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WaitCheckpointEngine;

  constructor(
    store: WaitCheckpointStore,
    validator: WaitCheckpointValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WaitCheckpointEngine,
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
      throw new Error(`wait checkpoint ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait checkpoint ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`wait checkpoint ${code} not found`);
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

export function newWaitCheckpointDesk(store: WaitCheckpointStore, clockValue: clock.Clock, flagsValue: flags.Registry): WaitCheckpointDesk {
  return new WaitCheckpointDesk(
    store,
    defaultWaitCheckpointValidator(),
    clockValue,
    [],
    defaultWaitCheckpointEngine(flagsValue),
  );
}
