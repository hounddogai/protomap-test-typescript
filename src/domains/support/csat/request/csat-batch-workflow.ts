import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { CsatBatchEngine, defaultCsatBatchEngine } from "./csat-batch-engine.js";
import { CsatBatchValidator, defaultCsatBatchValidator } from "./csat-batch-rules.js";
import { CsatBatchStore } from "./csat-batch-store.js";

/** Moves csat batches through their life cycle and keeps a journal of what it did. */
export class CsatBatchWorkflow {
  store: CsatBatchStore;
  validator: CsatBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: CsatBatchEngine;

  constructor(
    store: CsatBatchStore,
    validator: CsatBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: CsatBatchEngine,
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
      throw new Error(`csat batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`csat batch ${code} not found`);
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
      throw new Error(`csat batch ${code} not found`);
    }
    const result = this.engine.evaluate(item);
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

export function newCsatBatchWorkflow(store: CsatBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): CsatBatchWorkflow {
  return new CsatBatchWorkflow(store, defaultCsatBatchValidator(), clockValue, [], defaultCsatBatchEngine(flagsValue));
}
