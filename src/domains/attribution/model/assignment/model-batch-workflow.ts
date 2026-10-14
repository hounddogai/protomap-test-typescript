import * as clock from "../../../../kit/clock.js";
import { ModelBatchEngine, defaultModelBatchEngine } from "./model-batch-engine.js";
import { ModelBatchValidator, defaultModelBatchValidator } from "./model-batch-rules.js";
import { ModelBatchStore } from "./model-batch-store.js";

/** Moves model batches through their life cycle and keeps a journal of what it did. */
export class ModelBatchService {
  store: ModelBatchStore;
  validator: ModelBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelBatchEngine;

  constructor(
    store: ModelBatchStore,
    validator: ModelBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelBatchEngine,
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
      throw new Error(`model batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("validated");
    this.store.save(item);
    this.note(`${code} is validated`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("retired");
    this.store.save(item);
    this.note(`${code} is retired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model batch ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newModelBatchService(store: ModelBatchStore, clockValue: clock.Clock): ModelBatchService {
  return new ModelBatchService(store, defaultModelBatchValidator(), clockValue, [], defaultModelBatchEngine());
}
