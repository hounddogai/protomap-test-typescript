import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { FallbackNudgeEntryEngine, defaultFallbackNudgeEntryEngine } from "./fallback-nudge-entry-engine.js";
import { FallbackNudgeEntryValidator, defaultFallbackNudgeEntryValidator } from "./fallback-nudge-entry-rules.js";
import { FallbackNudgeEntryStore } from "./fallback-nudge-entry-store.js";

/** Moves fallback nudge entries through their life cycle and keeps a journal of what it did. */
export class FallbackNudgeEntryWorkflow {
  store: FallbackNudgeEntryStore;
  validator: FallbackNudgeEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: FallbackNudgeEntryEngine;

  constructor(
    store: FallbackNudgeEntryStore,
    validator: FallbackNudgeEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: FallbackNudgeEntryEngine,
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
      throw new Error(`fallback nudge entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback nudge entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`fallback nudge entry ${code} not found`);
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

export function newFallbackNudgeEntryWorkflow(store: FallbackNudgeEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): FallbackNudgeEntryWorkflow {
  return new FallbackNudgeEntryWorkflow(
    store,
    defaultFallbackNudgeEntryValidator(),
    clockValue,
    [],
    defaultFallbackNudgeEntryEngine(flagsValue),
  );
}
