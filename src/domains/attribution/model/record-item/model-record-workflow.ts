import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { ModelRecordEngine, defaultModelRecordEngine } from "./model-record-engine.js";
import { ModelRecordValidator, defaultModelRecordValidator } from "./model-record-rules.js";
import { ModelRecordStore } from "./model-record-store.js";

/** Moves model records through their life cycle and keeps a journal of what it did. */
export class ModelRecordCoordinator {
  store: ModelRecordStore;
  validator: ModelRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ModelRecordEngine;

  constructor(
    store: ModelRecordStore,
    validator: ModelRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ModelRecordEngine,
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
      throw new Error(`model record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`model record ${code} not found`);
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
      throw new Error(`model record ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newModelRecordCoordinator(store: ModelRecordStore, clockValue: clock.Clock, flagsValue: flags.Registry): ModelRecordCoordinator {
  return new ModelRecordCoordinator(
    store,
    defaultModelRecordValidator(),
    clockValue,
    [],
    defaultModelRecordEngine(flagsValue),
  );
}
