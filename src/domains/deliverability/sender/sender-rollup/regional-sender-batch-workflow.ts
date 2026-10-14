import * as clock from "../../../../kit/clock.js";
import { RegionalSenderBatchEngine, defaultRegionalSenderBatchEngine } from "./regional-sender-batch-engine.js";
import { RegionalSenderBatchValidator, defaultRegionalSenderBatchValidator } from "./regional-sender-batch-rules.js";
import { RegionalSenderBatchStore } from "./regional-sender-batch-store.js";

/** Moves regional sender batches through their life cycle and keeps a journal of what it did. */
export class RegionalSenderBatchService {
  store: RegionalSenderBatchStore;
  validator: RegionalSenderBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalSenderBatchEngine;

  constructor(
    store: RegionalSenderBatchStore,
    validator: RegionalSenderBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalSenderBatchEngine,
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
      throw new Error(`regional sender batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional sender batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional sender batch ${code} not found`);
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

export function newRegionalSenderBatchService(store: RegionalSenderBatchStore, clockValue: clock.Clock): RegionalSenderBatchService {
  return new RegionalSenderBatchService(
    store,
    defaultRegionalSenderBatchValidator(),
    clockValue,
    [],
    defaultRegionalSenderBatchEngine(),
  );
}
