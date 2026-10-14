import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { SenderBaselineEngine, defaultSenderBaselineEngine } from "./sender-baseline-engine.js";
import { SenderBaselineValidator, defaultSenderBaselineValidator } from "./sender-baseline-rules.js";
import { SenderBaselineStore } from "./sender-baseline-store.js";

/** Moves sender baselines through their life cycle and keeps a journal of what it did. */
export class SenderBaselineManager {
  store: SenderBaselineStore;
  validator: SenderBaselineValidator;
  clock: clock.Clock;
  journal: string[];
  engine: SenderBaselineEngine;

  constructor(
    store: SenderBaselineStore,
    validator: SenderBaselineValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: SenderBaselineEngine,
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
      throw new Error(`sender baseline ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  retire(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender baseline ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`sender baseline ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newSenderBaselineManager(store: SenderBaselineStore, clockValue: clock.Clock, flagsValue: flags.Registry): SenderBaselineManager {
  return new SenderBaselineManager(
    store,
    defaultSenderBaselineValidator(),
    clockValue,
    [],
    defaultSenderBaselineEngine(flagsValue),
  );
}
