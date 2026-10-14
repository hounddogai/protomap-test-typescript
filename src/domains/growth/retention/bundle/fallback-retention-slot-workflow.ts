import * as clock from "../../../../kit/clock.js";
import { FallbackRetentionSlotEngine, defaultFallbackRetentionSlotEngine } from "./fallback-retention-slot-engine.js";
import {
  FallbackRetentionSlotValidator,
  defaultFallbackRetentionSlotValidator,
} from "./fallback-retention-slot-rules.js";
import { FallbackRetentionSlotStore } from "./fallback-retention-slot-store.js";

/** Moves fallback retention slots through their life cycle and keeps a journal of what it did. */
export class FallbackRetentionSlotWorkflow {
  store: FallbackRetentionSlotStore;
  validator: FallbackRetentionSlotValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackRetentionSlotEngine;

  constructor(
    store: FallbackRetentionSlotStore,
    validator: FallbackRetentionSlotValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackRetentionSlotEngine,
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
      throw new Error(`fallback retention slot ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback retention slot ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback retention slot ${code} not found`);
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

export function newFallbackRetentionSlotWorkflow(store: FallbackRetentionSlotStore, clockValue: clock.Clock): FallbackRetentionSlotWorkflow {
  return new FallbackRetentionSlotWorkflow(
    store,
    defaultFallbackRetentionSlotValidator(),
    clockValue,
    [],
    defaultFallbackRetentionSlotEngine(),
  );
}
