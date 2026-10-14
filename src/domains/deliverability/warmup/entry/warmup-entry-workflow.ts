import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { WarmupEntryEngine, defaultWarmupEntryEngine } from "./warmup-entry-engine.js";
import { WarmupEntryValidator, defaultWarmupEntryValidator } from "./warmup-entry-rules.js";
import { WarmupEntryStore } from "./warmup-entry-store.js";

/** Moves warmup entries through their life cycle and keeps a journal of what it did. */
export class WarmupEntryManager {
  store: WarmupEntryStore;
  validator: WarmupEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: WarmupEntryEngine;

  constructor(
    store: WarmupEntryStore,
    validator: WarmupEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: WarmupEntryEngine,
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
      throw new Error(`warmup entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("approved");
    this.store.save(item);
    this.note(`${code} is approved`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("withdrawn");
    this.store.save(item);
    this.note(`${code} is withdrawn: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`warmup entry ${code} not found`);
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

export function newWarmupEntryManager(store: WarmupEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): WarmupEntryManager {
  return new WarmupEntryManager(
    store,
    defaultWarmupEntryValidator(),
    clockValue,
    [],
    defaultWarmupEntryEngine(flagsValue),
  );
}
