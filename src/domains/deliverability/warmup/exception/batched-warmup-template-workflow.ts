import * as clock from "../../../../kit/clock.js";
import { BatchedWarmupTemplateEngine, defaultBatchedWarmupTemplateEngine } from "./batched-warmup-template-engine.js";
import {
  BatchedWarmupTemplateValidator,
  defaultBatchedWarmupTemplateValidator,
} from "./batched-warmup-template-rules.js";
import { BatchedWarmupTemplateStore } from "./batched-warmup-template-store.js";

/** Moves batched warmup templates through their life cycle and keeps a journal of what it did. */
export class BatchedWarmupTemplateService {
  store: BatchedWarmupTemplateStore;
  validator: BatchedWarmupTemplateValidator;
  clock: clock.Clock;
  journal: string[];
  engine: BatchedWarmupTemplateEngine;

  constructor(
    store: BatchedWarmupTemplateStore,
    validator: BatchedWarmupTemplateValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: BatchedWarmupTemplateEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched warmup template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched warmup template ${code} not found`);
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
      throw new Error(`batched warmup template ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  audit(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedWarmupTemplateService(store: BatchedWarmupTemplateStore, clockValue: clock.Clock): BatchedWarmupTemplateService {
  return new BatchedWarmupTemplateService(
    store,
    defaultBatchedWarmupTemplateValidator(),
    clockValue,
    [],
    defaultBatchedWarmupTemplateEngine(),
  );
}
