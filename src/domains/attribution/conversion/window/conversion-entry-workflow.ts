import * as clock from "../../../../kit/clock.js";
import { ConversionEntryEngine, defaultConversionEntryEngine } from "./conversion-entry-engine.js";
import { ConversionEntryValidator, defaultConversionEntryValidator } from "./conversion-entry-rules.js";
import { ConversionEntryStore } from "./conversion-entry-store.js";

/** Moves conversion entries through their life cycle and keeps a journal of what it did. */
export class ConversionEntryWorkflow {
  store: ConversionEntryStore;
  validator: ConversionEntryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ConversionEntryEngine;

  constructor(
    store: ConversionEntryStore,
    validator: ConversionEntryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ConversionEntryEngine,
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
      throw new Error(`conversion entry ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion entry ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`conversion entry ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newConversionEntryWorkflow(store: ConversionEntryStore, clockValue: clock.Clock): ConversionEntryWorkflow {
  return new ConversionEntryWorkflow(
    store,
    defaultConversionEntryValidator(),
    clockValue,
    [],
    defaultConversionEntryEngine(),
  );
}
