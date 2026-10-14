import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RegionalCreativeEntryEngine, defaultRegionalCreativeEntryEngine } from "./regional-creative-entry-engine.js";
import {
  RegionalCreativeEntryValidator,
  defaultRegionalCreativeEntryValidator,
} from "./regional-creative-entry-rules.js";
import { RegionalCreativeEntryStore } from "./regional-creative-entry-store.js";

/** Moves regional creative entries through their life cycle and keeps a journal of what it did. */
export class RegionalCreativeEntryManager {
  store: RegionalCreativeEntryStore;
  validator: RegionalCreativeEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RegionalCreativeEntryEngine;

  constructor(
    store: RegionalCreativeEntryStore,
    validator: RegionalCreativeEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RegionalCreativeEntryEngine,
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
      throw new Error(`regional creative entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`regional creative entry ${code} not found`);
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
      throw new Error(`regional creative entry ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRegionalCreativeEntryManager(store: RegionalCreativeEntryStore, clockValue: clock.Clock, flagsValue: flags.Registry): RegionalCreativeEntryManager {
  return new RegionalCreativeEntryManager(
    store,
    defaultRegionalCreativeEntryValidator(),
    clockValue,
    [],
    defaultRegionalCreativeEntryEngine(flagsValue),
  );
}
