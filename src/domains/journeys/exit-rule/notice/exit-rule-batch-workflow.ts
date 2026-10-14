import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ExitRuleBatchEngine, defaultExitRuleBatchEngine } from "./exit-rule-batch-engine.js";
import { ExitRuleBatchValidator, defaultExitRuleBatchValidator } from "./exit-rule-batch-rules.js";
import { ExitRuleBatchStore } from "./exit-rule-batch-store.js";

/** Moves exit rule batches through their life cycle and keeps a journal of what it did. */
export class ExitRuleBatchDesk {
  store: ExitRuleBatchStore;
  validator: ExitRuleBatchValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ExitRuleBatchEngine;

  constructor(
    store: ExitRuleBatchStore,
    validator: ExitRuleBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ExitRuleBatchEngine,
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
      throw new Error(`exit rule batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`exit rule batch ${code} not found`);
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
      throw new Error(`exit rule batch ${code} not found`);
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

export function newExitRuleBatchDesk(store: ExitRuleBatchStore, clockValue: clock.Clock, flagsValue: flags.Registry): ExitRuleBatchDesk {
  return new ExitRuleBatchDesk(
    store,
    defaultExitRuleBatchValidator(),
    clockValue,
    [],
    defaultExitRuleBatchEngine(flagsValue),
  );
}
