import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { GlobalWaitBatchEngine, defaultGlobalWaitBatchEngine } from "./global-wait-batch-engine.js";
import { GlobalWaitBatchValidator, defaultGlobalWaitBatchValidator } from "./global-wait-batch-rules.js";
import { GlobalWaitBatchStore } from "./global-wait-batch-store.js";

/** Moves global wait batches through their life cycle and keeps a journal of what it did. */
export class GlobalWaitBatchWorkflow {
  store: GlobalWaitBatchStore;
  validator: GlobalWaitBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: GlobalWaitBatchEngine;

  constructor(
    store: GlobalWaitBatchStore,
    validator: GlobalWaitBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: GlobalWaitBatchEngine,
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
      throw new Error(`global wait batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global wait batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`global wait batch ${code} not found`);
    }
    const result = this.engine.run(item);
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

export function newGlobalWaitBatchWorkflow(store: GlobalWaitBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): GlobalWaitBatchWorkflow {
  return new GlobalWaitBatchWorkflow(
    store,
    defaultGlobalWaitBatchValidator(),
    clockValue,
    [],
    defaultGlobalWaitBatchEngine(flagsValue),
  );
}
