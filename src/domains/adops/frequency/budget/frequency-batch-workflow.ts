import * as clock from "../../../../kit/clock.js";
import { FrequencyBatchEngine, defaultFrequencyBatchEngine } from "./frequency-batch-engine.js";
import { FrequencyBatchValidator, defaultFrequencyBatchValidator } from "./frequency-batch-rules.js";
import { FrequencyBatchStore } from "./frequency-batch-store.js";

/** Moves frequency batches through their life cycle and keeps a journal of what it did. */
export class FrequencyBatchWorkflow {
  store: FrequencyBatchStore;
  validator: FrequencyBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FrequencyBatchEngine;

  constructor(
    store: FrequencyBatchStore,
    validator: FrequencyBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FrequencyBatchEngine,
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
      throw new Error(`frequency batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`frequency batch ${code} not found`);
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

export function newFrequencyBatchWorkflow(store: FrequencyBatchStore, clockValue: clock.Clock): FrequencyBatchWorkflow {
  return new FrequencyBatchWorkflow(
    store,
    defaultFrequencyBatchValidator(),
    clockValue,
    [],
    defaultFrequencyBatchEngine(),
  );
}
