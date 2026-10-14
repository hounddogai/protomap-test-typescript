import * as clock from "../../../../kit/clock.js";
import { ReputationBatchEngine, defaultReputationBatchEngine } from "./reputation-batch-engine.js";
import { ReputationBatchValidator, defaultReputationBatchValidator } from "./reputation-batch-rules.js";
import { ReputationBatchStore } from "./reputation-batch-store.js";

/** Moves reputation batches through their life cycle and keeps a journal of what it did. */
export class ReputationBatchManager {
  store: ReputationBatchStore;
  validator: ReputationBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ReputationBatchEngine;

  constructor(
    store: ReputationBatchStore,
    validator: ReputationBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ReputationBatchEngine,
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
      throw new Error(`reputation batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`reputation batch ${code} not found`);
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

export function newReputationBatchManager(store: ReputationBatchStore, clockValue: clock.Clock): ReputationBatchManager {
  return new ReputationBatchManager(
    store,
    defaultReputationBatchValidator(),
    clockValue,
    [],
    defaultReputationBatchEngine(),
  );
}
