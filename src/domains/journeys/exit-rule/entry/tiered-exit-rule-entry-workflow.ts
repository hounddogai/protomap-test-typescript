import * as clock from "../../../../kit/clock.js";
import { TieredExitRuleEntryEngine, defaultTieredExitRuleEntryEngine } from "./tiered-exit-rule-entry-engine.js";
import { TieredExitRuleEntryValidator, defaultTieredExitRuleEntryValidator } from "./tiered-exit-rule-entry-rules.js";
import { TieredExitRuleEntryStore } from "./tiered-exit-rule-entry-store.js";

/** Moves tiered exit rule entries through their life cycle and keeps a journal of what it did. */
export class TieredExitRuleEntryWorkflow {
  store: TieredExitRuleEntryStore;
  validator: TieredExitRuleEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: TieredExitRuleEntryEngine;

  constructor(
    store: TieredExitRuleEntryStore,
    validator: TieredExitRuleEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: TieredExitRuleEntryEngine,
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
      throw new Error(`tiered exit rule entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`tiered exit rule entry ${code} not found`);
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
      throw new Error(`tiered exit rule entry ${code} not found`);
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

export function newTieredExitRuleEntryWorkflow(store: TieredExitRuleEntryStore, clockValue: clock.Clock): TieredExitRuleEntryWorkflow {
  return new TieredExitRuleEntryWorkflow(
    store,
    defaultTieredExitRuleEntryValidator(),
    clockValue,
    [],
    defaultTieredExitRuleEntryEngine(),
  );
}
