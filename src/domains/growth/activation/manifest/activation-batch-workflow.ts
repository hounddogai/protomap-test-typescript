import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ActivationBatchEngine, defaultActivationBatchEngine } from "./activation-batch-engine.js";
import { ActivationBatchValidator, defaultActivationBatchValidator } from "./activation-batch-rules.js";
import { ActivationBatchStore } from "./activation-batch-store.js";

/** Moves activation batches through their life cycle and keeps a journal of what it did. */
export class ActivationBatchDesk {
  store: ActivationBatchStore;
  validator: ActivationBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationBatchEngine;

  constructor(
    store: ActivationBatchStore,
    validator: ActivationBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationBatchEngine,
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
      throw new Error(`activation batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation batch ${code} not found`);
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
      throw new Error(`activation batch ${code} not found`);
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

export function newActivationBatchDesk(store: ActivationBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): ActivationBatchDesk {
  return new ActivationBatchDesk(
    store,
    defaultActivationBatchValidator(),
    clockValue,
    [],
    defaultActivationBatchEngine(flagsValue),
  );
}
